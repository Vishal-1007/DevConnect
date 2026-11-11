package com.developersconnect.payment.service;

import com.developersconnect.payment.config.ZoomOAuthProperties;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ZoomOAuthService {

    private static final Logger log = LoggerFactory.getLogger(ZoomOAuthService.class);

    private static final String AUTH_URL = "https://zoom.us/oauth/authorize";
    private static final String TOKEN_URL = "https://zoom.us/oauth/token";
    private static final String USER_URL = "https://api.zoom.us/v2/users/me";

    private final ZoomOAuthProperties properties;
    private final RecruiterOAuthStateService stateService;
    private final RecruiterIntegrationRepository repository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ZoomOAuthService(
        ZoomOAuthProperties properties,
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
        String redirectUri = properties.getRedirectUri();
        String clientId = properties.getClientId();
        String scopes = properties.getScopes();
        String state = stateService.createState(recruiterId, RecruiterIntegrationProvider.ZOOM);
        // Popup must open the bridge on the callback host (lvh.me) so a state cookie is set before
        // Zoom authorization. Zoom often omits the state query param on redirect.
        String bridgeUrl = properties.getOAuthBridgeUri() + "?state=" + oauthFormEncode(state);
        String zoomAuthorizeUrl = buildZoomAuthorizeUrl(clientId, redirectUri, state);

        log.info(
            "Zoom OAuth bridge URL generated client_id={} redirect_uri={} scopes={} bridgeUrl={} zoomAuthorizeUrl={}",
            clientId,
            redirectUri,
            scopes,
            bridgeUrl,
            zoomAuthorizeUrl
        );

        return bridgeUrl;
    }

    public String buildAuthorizeUrlForState(String state) {
        requireConfigured();
        return buildZoomAuthorizeUrl(
            properties.getClientId(),
            properties.getRedirectUri(),
            state
        );
    }

    static String buildZoomAuthorizeUrl(String clientId, String redirectUri, String state) {
        // OAuth 2.0 (RFC 6749 appendix B) requires application/x-www-form-urlencoded query values.
        // Spring UriComponentsBuilder/UriUtils leave ":" and "/" unencoded in query params, which
        // Zoom Strict Mode rejects with error 4700.
        // Scopes are configured in Zoom Marketplace — omit scope here to avoid post-consent failures.
        String query = "response_type=code"
            + "&client_id=" + oauthFormEncode(clientId)
            + "&redirect_uri=" + oauthFormEncode(redirectUri)
            + "&state=" + oauthFormEncode(state);
        return AUTH_URL + "?" + query;
    }

    private static String oauthFormEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    @Transactional
    public RecruiterIntegration completeOAuthCallback(String code, String state, UUID sessionRecruiterId) {
        requireConfigured();
        log.info("Zoom OAuth completing callback code={} state={} sessionRecruiterId={}", code, state, sessionRecruiterId);

        GoogleOAuthService.TokenResponse tokens = exchangeAuthorizationCode(code);
        log.info(
            "Zoom OAuth token exchange succeeded expiresIn={} refreshTokenPresent={}",
            tokens.expiresIn(),
            tokens.refreshToken() != null && !tokens.refreshToken().isBlank()
        );

        UUID recruiterId = resolveRecruiterId(state, sessionRecruiterId);
        if (recruiterId == null) {
            log.error(
                "Zoom OAuth token exchanged but recruiter could not be resolved state={} sessionRecruiterId={}",
                state,
                sessionRecruiterId
            );
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OAuth state");
        }

        String email = fetchUserEmail(tokens.accessToken());
        RecruiterIntegration integration = saveIntegration(recruiterId, tokens, email);
        log.info(
            "Zoom OAuth integration saved recruiterId={} connectedEmail={} expiresAt={}",
            recruiterId,
            email,
            integration.getTokenExpiresAt()
        );
        return integration;
    }

    private UUID resolveRecruiterId(String state, UUID sessionRecruiterId) {
        if (state != null && !state.isBlank()) {
            RecruiterOAuthStateService.OAuthStatePayload payload = stateService.consumeState(state);
            if (payload != null && payload.provider() == RecruiterIntegrationProvider.ZOOM) {
                return payload.recruiterId();
            }
        }
        return sessionRecruiterId;
    }

    @Transactional
    public RecruiterIntegration refreshAccessTokenIfNeeded(RecruiterIntegration integration) {
        if (integration.getTokenExpiresAt() == null
            || integration.getTokenExpiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return integration;
        }
        if (integration.getRefreshToken() == null || integration.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Zoom access expired. Please reconnect Zoom.");
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
            .uri(USER_URL)
            .header("Authorization", "Bearer " + accessToken)
            .retrieve()
            .body(JsonNode.class);
    }

    public void requireConfigured() {
        if (properties.getClientId() == null || properties.getClientId().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Zoom Client ID — set ZOOM_CLIENT_ID in payment-service environment"
            );
        }
        if (properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Missing Zoom Client Secret — set ZOOM_CLIENT_SECRET in payment-service environment"
            );
        }
    }

    private RecruiterIntegration saveIntegration(
        UUID recruiterId,
        GoogleOAuthService.TokenResponse tokens,
        String email
    ) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.ZOOM)
            .orElseGet(() -> {
                RecruiterIntegration created = new RecruiterIntegration();
                created.setRecruiterId(recruiterId);
                created.setProvider(RecruiterIntegrationProvider.ZOOM);
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
        String redirectUri = properties.getRedirectUri();
        log.info(
            "Zoom OAuth token exchange request grant_type=authorization_code redirect_uri={} code={}",
            redirectUri,
            code
        );
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        return postTokenRequest(body);
    }

    private GoogleOAuthService.TokenResponse refreshToken(String refreshToken) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", refreshToken);
        return postTokenRequest(body);
    }

    private GoogleOAuthService.TokenResponse postTokenRequest(MultiValueMap<String, String> body) {
        try {
            String credentials = properties.getClientId() + ":" + properties.getClientSecret();
            String basic = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            log.info(
                "Zoom OAuth POST {} grant_type={} redirect_uri={}",
                TOKEN_URL,
                body.getFirst("grant_type"),
                body.getFirst("redirect_uri")
            );

            String response = restClient.post()
                .uri(TOKEN_URL)
                .header("Authorization", "Basic " + basic)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(String.class);

            log.info("Zoom OAuth token API response body={}", response);

            JsonNode node = objectMapper.readTree(response);
            if (node.hasNonNull("error")) {
                String errorCode = node.path("error").asText("unknown_error");
                String reason = node.path("reason").asText(node.path("error_description").asText(errorCode));
                log.error(
                    "Zoom OAuth token exchange rejected by Zoom API error={} reason={} fullResponse={}",
                    errorCode,
                    reason,
                    response
                );
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Zoom OAuth token exchange failed: " + reason + " (" + errorCode + ")"
                );
            }
            return new GoogleOAuthService.TokenResponse(
                node.path("access_token").asText(null),
                node.path("refresh_token").asText(null),
                node.path("expires_in").asLong(0)
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RestClientResponseException ex) {
            String responseBody = ex.getResponseBodyAsString();
            log.error(
                "Zoom OAuth token exchange HTTP {} responseBody={}",
                ex.getStatusCode().value(),
                responseBody
            );
            throw toTokenHttpError(ex);
        } catch (Exception ex) {
            log.error("Zoom OAuth token exchange failed unexpectedly", ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Zoom OAuth token exchange failed", ex);
        }
    }

    private static String maskSecret(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= 8) {
            return "****";
        }
        return trimmed.substring(0, 8) + "****";
    }

    private ResponseStatusException toTokenHttpError(RestClientResponseException httpError) {
        String fallbackMessage =
            "Zoom OAuth token exchange failed: HTTP " + httpError.getStatusCode().value();
        String body = httpError.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return new ResponseStatusException(HttpStatus.BAD_GATEWAY, fallbackMessage);
        }

        try {
            JsonNode node = objectMapper.readTree(body);
            String errorCode = node.path("error").asText("http_" + httpError.getStatusCode().value());
            String reason = node.path("reason").asText(node.path("error_description").asText(httpError.getStatusText()));
            return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Zoom OAuth token exchange failed: " + reason + " (" + errorCode + ")"
            );
        } catch (IOException parseEx) {
            return new ResponseStatusException(HttpStatus.BAD_GATEWAY, fallbackMessage);
        }
    }

    private String fetchUserEmail(String accessToken) {
        try {
            JsonNode response = restClient.get()
                .uri(USER_URL)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class);

            if (response != null && response.hasNonNull("email")) {
                return response.get("email").asText();
            }
            if (response != null && response.hasNonNull("id")) {
                return response.get("id").asText() + "@zoom.us";
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Zoom account email");
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to read Zoom account email", ex);
        }
    }
}
