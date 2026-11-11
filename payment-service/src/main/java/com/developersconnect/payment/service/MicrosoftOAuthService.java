package com.developersconnect.payment.service;

import com.developersconnect.payment.config.MicrosoftOAuthProperties;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class MicrosoftOAuthService {

    private static final String GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me";

    private final MicrosoftOAuthProperties properties;
    private final RecruiterOAuthStateService stateService;
    private final RecruiterIntegrationRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public MicrosoftOAuthService(
        MicrosoftOAuthProperties properties,
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
        String state = stateService.createState(recruiterId, RecruiterIntegrationProvider.MICROSOFT_TEAMS);
        return UriComponentsBuilder.fromHttpUrl(properties.authorizationBaseUrl())
            .queryParam("client_id", properties.getClientId())
            .queryParam("response_type", "code")
            .queryParam("redirect_uri", properties.getRedirectUri())
            .queryParam("response_mode", "query")
            .queryParam("scope", properties.getScopes())
            .queryParam("state", state)
            .queryParam("prompt", "consent")
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();
    }

    @Transactional
    public RecruiterIntegration completeOAuthCallback(String code, String state) {
        requireConfigured();
        RecruiterOAuthStateService.OAuthStatePayload payload = stateService.consumeState(state);
        if (payload == null || payload.provider() != RecruiterIntegrationProvider.MICROSOFT_TEAMS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OAuth state");
        }

        GoogleOAuthService.TokenResponse tokens = exchangeAuthorizationCode(code);
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
                "Microsoft Teams access expired. Please reconnect Microsoft Teams."
            );
        }

        GoogleOAuthService.TokenResponse tokens = refreshToken(integration.getRefreshToken());
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

    public void testConnection(String accessToken) {
        restClient.get()
            .uri(GRAPH_ME_URL)
            .header("Authorization", "Bearer " + accessToken)
            .retrieve()
            .body(JsonNode.class);
    }

    public void requireConfigured() {
        if (properties.getClientId() == null || properties.getClientId().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Microsoft Client ID — set MICROSOFT_CLIENT_ID in payment-service environment"
            );
        }
        if (properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Microsoft Client Secret — set MICROSOFT_CLIENT_SECRET in payment-service environment"
            );
        }
    }

    private RecruiterIntegration saveIntegration(
        UUID recruiterId,
        GoogleOAuthService.TokenResponse tokens,
        String email
    ) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.MICROSOFT_TEAMS)
            .orElseGet(() -> {
                RecruiterIntegration created = new RecruiterIntegration();
                created.setRecruiterId(recruiterId);
                created.setProvider(RecruiterIntegrationProvider.MICROSOFT_TEAMS);
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

    private GoogleOAuthService.TokenResponse exchangeAuthorizationCode(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("code", code);
        body.add("redirect_uri", properties.getRedirectUri());
        body.add("grant_type", "authorization_code");
        body.add("scope", properties.getScopes());
        return postTokenRequest(body);
    }

    private GoogleOAuthService.TokenResponse refreshToken(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", properties.getClientId());
        body.add("client_secret", properties.getClientSecret());
        body.add("refresh_token", refreshToken);
        body.add("grant_type", "refresh_token");
        body.add("scope", properties.getScopes());
        return postTokenRequest(body);
    }

    private GoogleOAuthService.TokenResponse postTokenRequest(MultiValueMap<String, String> body) {
        try {
            String response = restClient.post()
                .uri(properties.tokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(String.class);

            JsonNode node = objectMapper.readTree(response);
            if (node.hasNonNull("error")) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Microsoft OAuth token exchange failed: "
                        + node.path("error_description").asText(node.path("error").asText())
                );
            }
            return new GoogleOAuthService.TokenResponse(
                node.path("access_token").asText(null),
                node.path("refresh_token").asText(null),
                node.path("expires_in").asLong(0)
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Microsoft OAuth token exchange failed", ex);
        }
    }

    private String fetchUserEmail(String accessToken) {
        try {
            JsonNode response = restClient.get()
                .uri(GRAPH_ME_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Microsoft account email");
            }
            if (response.hasNonNull("mail") && !response.get("mail").asText().isBlank()) {
                return response.get("mail").asText();
            }
            if (response.hasNonNull("userPrincipalName")) {
                return response.get("userPrincipalName").asText();
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Microsoft account email");
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Microsoft account email", ex);
        }
    }
}
