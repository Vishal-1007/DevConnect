package com.developersconnect.payment.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.developersconnect.payment.config.GoogleOAuthProperties;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class GoogleOAuthService {

    private static final String AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    private final GoogleOAuthProperties properties;
    private final RecruiterOAuthStateService stateService;
    private final RecruiterIntegrationRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GoogleOAuthService(
        GoogleOAuthProperties properties,
        RecruiterOAuthStateService stateService,
        RecruiterIntegrationRepository repository,
        ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.stateService = stateService;
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public String buildAuthorizationUrl(UUID recruiterId) {
        requireConfigured();
        String state = stateService.createState(recruiterId, RecruiterIntegrationProvider.GOOGLE_CALENDAR);
        return UriComponentsBuilder.fromHttpUrl(AUTH_URL)
            .queryParam("client_id", properties.getClientId())
            .queryParam("redirect_uri", properties.getRedirectUri())
            .queryParam("response_type", "code")
            .queryParam("scope", properties.getCalendarScope())
            .queryParam("access_type", "offline")
            .queryParam("prompt", "consent")
            .queryParam("state", state)
            .queryParam("include_granted_scopes", "true")
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();
    }

    @Transactional
    public RecruiterIntegration completeOAuthCallback(String code, String state) {
        requireConfigured();
        RecruiterOAuthStateService.OAuthStatePayload payload = stateService.consumeState(state);
        if (payload == null || payload.provider() != RecruiterIntegrationProvider.GOOGLE_CALENDAR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OAuth state");
        }

        TokenResponse tokens = exchangeAuthorizationCode(code);
        String email = fetchUserEmail(tokens.accessToken());
        return saveIntegration(payload.recruiterId(), tokens, email);
    }

    @Transactional
    public RecruiterIntegration refreshAccessTokenIfNeeded(RecruiterIntegration integration) {
        if (integration.getTokenExpiresAt() == null
            || integration.getTokenExpiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return integration;
        }
        if (integration.getRefreshToken() == null || integration.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Google Calendar access expired. Please reconnect Google Calendar."
            );
        }

        TokenResponse tokens = refreshToken(integration.getRefreshToken());
        integration.setAccessToken(tokens.accessToken());
        if (tokens.refreshToken() != null && !tokens.refreshToken().isBlank()) {
            integration.setRefreshToken(tokens.refreshToken());
        }
        integration.setTokenExpiresAt(
            tokens.expiresIn() > 0 ? Instant.now().plusSeconds(tokens.expiresIn()) : null
        );
        integration.setLastSyncAt(Instant.now());
        return repository.save(integration);
    }

    public void revokeToken(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return;
        }
        try {
            restClient.post()
                .uri("https://oauth2.googleapis.com/revoke?token=" + accessToken)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            // Best-effort revoke during disconnect
        }
    }

    private RecruiterIntegration saveIntegration(UUID recruiterId, TokenResponse tokens, String email) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.GOOGLE_CALENDAR)
            .orElseGet(() -> {
                RecruiterIntegration created = new RecruiterIntegration();
                created.setRecruiterId(recruiterId);
                created.setProvider(RecruiterIntegrationProvider.GOOGLE_CALENDAR);
                return created;
            });

        Instant now = Instant.now();
        integration.setConnected(true);
        integration.setAccessToken(tokens.accessToken());
        integration.setRefreshToken(
            tokens.refreshToken() != null ? tokens.refreshToken() : integration.getRefreshToken()
        );
        integration.setTokenExpiresAt(tokens.expiresIn() > 0 ? now.plusSeconds(tokens.expiresIn()) : null);
        integration.setConnectedEmail(email);
        integration.setConnectedAt(now);
        integration.setLastSyncAt(now);
        return repository.save(integration);
    }

    private TokenResponse exchangeAuthorizationCode(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("redirect_uri", properties.getRedirectUri());
        body.add("grant_type", "authorization_code");
        return postTokenRequest(TOKEN_URL, body);
    }

    private TokenResponse refreshToken(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("refresh_token", refreshToken);
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("grant_type", "refresh_token");
        return postTokenRequest(TOKEN_URL, body);
    }

    private TokenResponse postTokenRequest(String url, MultiValueMap<String, String> body) {
        try {
            String response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(String.class);

            return parseTokenResponse(response);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            throw mapTokenHttpError(ex);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google OAuth token exchange failed", ex);
        }
    }

    private TokenResponse parseTokenResponse(String response) throws IOException {
        JsonNode node = objectMapper.readTree(response);
        if (node.hasNonNull("error")) {
            String code = node.path("error").asText("unknown_error");
            String description = node.path("error_description").asText(code);
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Google OAuth token exchange failed: " + description + " (" + code + ")"
            );
        }
        return new TokenResponse(
            node.path("access_token").asText(null),
            node.path("refresh_token").asText(null),
            node.path("expires_in").asLong(0)
        );
    }

    private ResponseStatusException mapTokenHttpError(RestClientResponseException ex) {
        String fallbackMessage =
            "Google OAuth token exchange failed: HTTP " + ex.getStatusCode().value();
        String body = ex.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return new ResponseStatusException(HttpStatus.BAD_GATEWAY, fallbackMessage);
        }

        try {
            JsonNode node = objectMapper.readTree(body);
            String code = node.path("error").asText("http_" + ex.getStatusCode().value());
            String description = node.path("error_description").asText(ex.getStatusText());
            return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Google OAuth token exchange failed: " + description + " (" + code + ")"
            );
        } catch (IOException parseEx) {
            return new ResponseStatusException(HttpStatus.BAD_GATEWAY, fallbackMessage);
        }
    }

    private String fetchUserEmail(String accessToken) {
        try {
            JsonNode response = restClient.get()
                .uri(USERINFO_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class);

            if (response == null || !response.hasNonNull("email")) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Google account email");
            }
            return response.get("email").asText();
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Google account email", ex);
        }
    }

    public void requireConfigured() {
        if (properties.getClientId() == null || properties.getClientId().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Google Client ID — set GOOGLE_CLIENT_ID in payment-service environment"
            );
        }
        if (properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Google Client Secret — set GOOGLE_CLIENT_SECRET in payment-service environment"
            );
        }
    }

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn) {}
}
