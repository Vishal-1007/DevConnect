package com.developersconnect.payment;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.developersconnect.payment.config.GoogleOAuthProperties;
import com.developersconnect.payment.config.MicrosoftOAuthProperties;
import com.developersconnect.payment.config.ZoomOAuthProperties;
import com.developersconnect.payment.dto.GoogleOAuthUrlResponse;
import com.developersconnect.payment.dto.IntegrationOAuthConfigStatus;
import com.developersconnect.payment.dto.IntegrationTestConnectionResponse;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.security.RecruiterAuth;
import com.developersconnect.payment.service.GoogleOAuthService;
import com.developersconnect.payment.service.MicrosoftOAuthService;
import com.developersconnect.payment.service.RecruiterCalendarService;
import com.developersconnect.payment.service.RecruiterOAuthStateService;
import com.developersconnect.payment.service.ZoomOAuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/recruiter/integrations")
public class IntegrationOAuthController {

    private static final Logger log = LoggerFactory.getLogger(IntegrationOAuthController.class);
    private static final String ZOOM_OAUTH_STATE_COOKIE = "dc_zoom_oauth_state";
    private static final String ZOOM_OAUTH_STATE_SESSION_ATTR = "dc_zoom_oauth_state";
    private static final String ZOOM_OAUTH_RECRUITER_ID_SESSION_ATTR = "dc_zoom_oauth_recruiter_id";
    private static final String ZOOM_OAUTH_STATE_COOKIE_PATH = "/";

    private final GoogleOAuthService googleOAuthService;
    private final ZoomOAuthService zoomOAuthService;
    private final MicrosoftOAuthService microsoftOAuthService;
    private final RecruiterOAuthStateService oauthStateService;
    private final GoogleOAuthProperties googleOAuthProperties;
    private final ZoomOAuthProperties zoomOAuthProperties;
    private final MicrosoftOAuthProperties microsoftOAuthProperties;
    private final RecruiterCalendarService calendarService;
    private final RecruiterIntegrationRepository repository;

    public IntegrationOAuthController(
        GoogleOAuthService googleOAuthService,
        ZoomOAuthService zoomOAuthService,
        MicrosoftOAuthService microsoftOAuthService,
        RecruiterOAuthStateService oauthStateService,
        GoogleOAuthProperties googleOAuthProperties,
        ZoomOAuthProperties zoomOAuthProperties,
        MicrosoftOAuthProperties microsoftOAuthProperties,
        RecruiterCalendarService calendarService,
        RecruiterIntegrationRepository repository
    ) {
        this.googleOAuthService = googleOAuthService;
        this.zoomOAuthService = zoomOAuthService;
        this.microsoftOAuthService = microsoftOAuthService;
        this.oauthStateService = oauthStateService;
        this.googleOAuthProperties = googleOAuthProperties;
        this.zoomOAuthProperties = zoomOAuthProperties;
        this.microsoftOAuthProperties = microsoftOAuthProperties;
        this.calendarService = calendarService;
        this.repository = repository;
    }

    @GetMapping("/oauth/config")
    public ResponseEntity<java.util.Map<RecruiterIntegrationProvider, IntegrationOAuthConfigStatus>> getOAuthConfig() {
        return ResponseEntity.ok(
            java.util.Map.of(
                RecruiterIntegrationProvider.GOOGLE_CALENDAR,
                oauthStatus(
                    googleOAuthProperties.getClientId(),
                    googleOAuthProperties.getClientSecret(),
                    googleOAuthProperties.getRedirectUri(),
                    "Google Calendar"
                ),
                RecruiterIntegrationProvider.ZOOM,
                oauthStatus(
                    zoomOAuthProperties.getClientId(),
                    zoomOAuthProperties.getClientSecret(),
                    zoomOAuthProperties.getRedirectUri(),
                    "Zoom"
                ),
                RecruiterIntegrationProvider.MICROSOFT_TEAMS,
                oauthStatus(
                    microsoftOAuthProperties.getClientId(),
                    microsoftOAuthProperties.getClientSecret(),
                    microsoftOAuthProperties.getRedirectUri(),
                    "Microsoft Teams"
                )
            )
        );
    }

    private IntegrationOAuthConfigStatus oauthStatus(
        String clientId,
        String clientSecret,
        String redirectUri,
        String label
    ) {
        if (clientId == null || clientId.isBlank()) {
            return new IntegrationOAuthConfigStatus(
                false,
                "Missing " + label + " Client ID",
                redirectUri
            );
        }
        if (clientSecret == null || clientSecret.isBlank()) {
            return new IntegrationOAuthConfigStatus(
                false,
                "Missing " + label + " Client Secret",
                redirectUri
            );
        }
        return new IntegrationOAuthConfigStatus(true, label + " OAuth configured", redirectUri);
    }

    @GetMapping("/GOOGLE_CALENDAR/oauth/url")
    public ResponseEntity<GoogleOAuthUrlResponse> getGoogleOAuthUrl(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(new GoogleOAuthUrlResponse(googleOAuthService.buildAuthorizationUrl(principal.accountId())));
    }

    @GetMapping("/ZOOM/oauth/url")
    public ResponseEntity<GoogleOAuthUrlResponse> getZoomOAuthUrl(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(new GoogleOAuthUrlResponse(zoomOAuthService.buildAuthorizationUrl(principal.accountId())));
    }

    @GetMapping("/MICROSOFT_TEAMS/oauth/url")
    public ResponseEntity<GoogleOAuthUrlResponse> getTeamsOAuthUrl(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(
            new GoogleOAuthUrlResponse(microsoftOAuthService.buildAuthorizationUrl(principal.accountId()))
        );
    }

    @GetMapping("/oauth/google/callback")
    public ResponseEntity<Void> handleGoogleCallback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error
    ) {
        return handleCallback(
            RecruiterIntegrationProvider.GOOGLE_CALENDAR,
            error,
            code,
            state,
            () -> {
                googleOAuthService.completeOAuthCallback(code, state);
                return null;
            },
            "Google Calendar connected successfully"
        );
    }

    @GetMapping("/oauth/zoom/bridge")
    public ResponseEntity<Void> handleZoomOAuthBridge(
        @RequestParam(value = "state", required = false) String state,
        HttpServletRequest request
    ) {
        if (state == null || state.isBlank()) {
            return withZoomOAuthCookieCleared(
                redirectError(RecruiterIntegrationProvider.ZOOM, "Missing OAuth state parameter", "missing_oauth_state")
            );
        }

        String trimmedState = state.trim();
        if (!oauthStateService.isValidState(trimmedState, RecruiterIntegrationProvider.ZOOM)) {
            return withZoomOAuthCookieCleared(
                redirectError(RecruiterIntegrationProvider.ZOOM, "Invalid or expired OAuth state", "invalid_oauth_state")
            );
        }

        request.getSession(true).setAttribute(ZOOM_OAUTH_STATE_SESSION_ATTR, trimmedState);
        oauthStateService
            .findRecruiterId(trimmedState, RecruiterIntegrationProvider.ZOOM)
            .ifPresent(recruiterId ->
                request.getSession(true).setAttribute(ZOOM_OAUTH_RECRUITER_ID_SESSION_ATTR, recruiterId.toString())
            );
        String zoomAuthorizeUrl = zoomOAuthService.buildAuthorizeUrlForState(trimmedState);
        log.info("Zoom OAuth bridge redirecting to authorize URL state={}", trimmedState);

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(zoomAuthorizeUrl));
        headers.add(HttpHeaders.SET_COOKIE, buildZoomOAuthStateCookie(trimmedState).toString());
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    @GetMapping("/oauth/zoom/callback")
    public ResponseEntity<Void> handleZoomCallbackGet(
        HttpServletRequest request,
        @RequestParam(name = "code", required = false) String code,
        @RequestParam(value = "state", required = false) String state,
        @RequestParam(value = "error", required = false) String error
    ) {
        return handleZoomCallback(request, code, state, error);
    }

    @PostMapping("/oauth/zoom/callback")
    public ResponseEntity<Void> handleZoomCallbackPost(
        HttpServletRequest request,
        @RequestParam(name = "code", required = false) String code,
        @RequestParam(value = "state", required = false) String state,
        @RequestParam(value = "error", required = false) String error
    ) {
        return handleZoomCallback(request, code, state, error);
    }

    private ResponseEntity<Void> handleZoomCallback(
        HttpServletRequest request,
        String code,
        String state,
        String error
    ) {
        String callbackUrl = buildCallbackUrl(request);
        String resolvedCode = resolveAuthorizationCode(request, code);
        String queryState = firstNonBlank(state, null);
        String resolvedState = resolveZoomOAuthState(request, queryState);
        UUID sessionRecruiterId = resolveZoomOAuthRecruiterId(request);

        log.info("Zoom OAuth callback full URL={}", callbackUrl);
        log.info("Zoom OAuth callback received code={}", resolvedCode != null ? resolvedCode : "(missing)");
        log.info("Zoom OAuth callback received state={}", queryState != null ? queryState : "(missing)");
        log.info(
            "Zoom OAuth callback resolved state={} sessionRecruiterId={} error={}",
            resolvedState != null ? resolvedState : "(missing)",
            sessionRecruiterId,
            error
        );

        if ((error == null || error.isBlank()) && (resolvedCode == null || resolvedCode.isBlank())) {
            log.info("Zoom OAuth callback probe — no code or error parameter present");
            return ResponseEntity.ok().build();
        }

        if (error != null && !error.isBlank()) {
            String message = "Zoom OAuth failed: " + error;
            return withZoomOAuthCookieCleared(redirectZoomError(message, error));
        }

        if (resolvedCode == null || resolvedCode.isBlank()) {
            return withZoomOAuthCookieCleared(
                redirectZoomError("Missing OAuth authorization code", "missing_authorization_code")
            );
        }

        try {
            zoomOAuthService.completeOAuthCallback(resolvedCode, resolvedState, sessionRecruiterId);
            return withZoomOAuthCookieCleared(redirectZoomSuccess());
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : "Zoom connection failed";
            log.error("Zoom OAuth callback failed: {}", message, ex);
            return withZoomOAuthCookieCleared(redirectZoomError(message, oauthErrorCode(message)));
        } catch (Exception ex) {
            log.error("Zoom OAuth callback failed unexpectedly", ex);
            String message = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage()
                : "Zoom connection failed";
            return withZoomOAuthCookieCleared(redirectZoomError(message, "oauth_failed"));
        } finally {
            clearZoomOAuthSessionState(request);
        }
    }

    @GetMapping("/oauth/teams/callback")
    public ResponseEntity<Void> handleTeamsCallback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error
    ) {
        return handleCallback(
            RecruiterIntegrationProvider.MICROSOFT_TEAMS,
            error,
            code,
            state,
            () -> {
                microsoftOAuthService.completeOAuthCallback(code, state);
                return null;
            },
            "Microsoft Teams connected successfully"
        );
    }

    @PostMapping("/{provider}/test")
    public ResponseEntity<IntegrationTestConnectionResponse> testConnection(
        Authentication authentication,
        @PathVariable RecruiterIntegrationProvider provider
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        RecruiterIntegration integration = requireConnected(principal.accountId(), provider);

        switch (provider) {
            case GOOGLE_CALENDAR:
                calendarService.testGoogleCalendarConnection(principal.accountId());
                return okResponse(provider, integration, "Google Calendar connected successfully");
            case ZOOM: {
                RecruiterIntegration refreshed = zoomOAuthService.refreshAccessTokenIfNeeded(integration);
                zoomOAuthService.testConnection(refreshed.getAccessToken());
                return okResponse(provider, refreshed, "Zoom connection working");
            }
            case MICROSOFT_TEAMS: {
                RecruiterIntegration refreshed = microsoftOAuthService.refreshAccessTokenIfNeeded(integration);
                microsoftOAuthService.testConnection(refreshed.getAccessToken());
                return okResponse(provider, refreshed, "Microsoft Teams connection working");
            }
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported integration provider");
        }
    }

    private ResponseEntity<Void> handleCallback(
        RecruiterIntegrationProvider provider,
        String error,
        String code,
        String state,
        Supplier<?> connectAction,
        String successMessage
    ) {
        if (error != null && !error.isBlank()) {
            String message = providerLabel(provider) + " OAuth failed: " + error;
            return redirectError(provider, message, error);
        }
        if (code == null || code.isBlank()) {
            return redirectError(provider, "Missing OAuth authorization code", "missing_authorization_code");
        }
        if (state == null || state.isBlank()) {
            return redirectError(provider, "Missing OAuth state parameter", "missing_oauth_state");
        }

        try {
            connectAction.get();
            return redirectSuccess(provider, successMessage);
        } catch (ResponseStatusException ex) {
            String message = ex.getReason() != null ? ex.getReason() : providerLabel(provider) + " connection failed";
            return redirectError(provider, message, oauthErrorCode(message));
        } catch (Exception ex) {
            String message = ex.getMessage();
            if (message == null || message.isBlank()) {
                message = providerLabel(provider) + " connection failed";
            }
            return redirectError(provider, message, oauthErrorCode(message));
        }
    }

    private String oauthErrorCode(String message) {
        if (message == null) {
            return "oauth_failed";
        }
        String lower = message.toLowerCase();
        if (lower.contains("invalid_grant")) return "invalid_grant";
        if (lower.contains("redirect_uri")) return "invalid_redirect_uri";
        if (lower.contains("invalid_client")) return "invalid_client";
        if (lower.contains("access_denied")) return "access_denied";
        if (lower.contains("invalid or expired oauth state")) return "invalid_oauth_state";
        return "oauth_failed";
    }

    private ResponseEntity<Void> redirectSuccess(RecruiterIntegrationProvider provider, String message) {
        return redirect(provider, true, message, null);
    }

    private ResponseEntity<Void> redirectError(
        RecruiterIntegrationProvider provider,
        String message,
        String details
    ) {
        return redirect(provider, false, message, details);
    }

    private ResponseEntity<Void> redirectZoomSuccess() {
        URI location = UriComponentsBuilder
            .fromHttpUrl(zoomOAuthProperties.getFrontendRedirectUri())
            .queryParam("oauth", "success")
            .queryParam("success", true)
            .queryParam("provider", RecruiterIntegrationProvider.ZOOM.name())
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUri();
        log.info("Zoom OAuth redirecting frontend success location={}", location);
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    private ResponseEntity<Void> redirectZoomError(String message, String details) {
        UriComponentsBuilder builder = UriComponentsBuilder
            .fromHttpUrl(zoomOAuthProperties.getFrontendRedirectUri())
            .queryParam("oauth", "error")
            .queryParam("success", false)
            .queryParam("provider", RecruiterIntegrationProvider.ZOOM.name())
            .queryParam("message", message)
            .queryParam("error", message);
        if (details != null && !details.isBlank()) {
            builder.queryParam("details", details);
        }
        URI location = builder.build().encode(StandardCharsets.UTF_8).toUri();
        log.info("Zoom OAuth redirecting frontend error location={}", location);
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    private ResponseEntity<Void> redirect(
        RecruiterIntegrationProvider provider,
        boolean success,
        String message,
        String details
    ) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(
                resolveFrontendRedirectUri(provider, success)
            )
            .queryParam("oauth", success ? "success" : "error")
            .queryParam("success", success)
            .queryParam("provider", provider.name())
            .queryParam("message", message);

        if (!success) {
            builder.queryParam("error", message);
        }
        if (details != null && !details.isBlank()) {
            builder.queryParam("details", details);
        }

        URI location = builder.build().encode(StandardCharsets.UTF_8).toUri();
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    private String resolveFrontendRedirectUri(RecruiterIntegrationProvider provider, boolean success) {
        if (provider == RecruiterIntegrationProvider.MICROSOFT_TEAMS) {
            return success
                ? microsoftOAuthProperties.getFrontendSuccessRedirectUri()
                : microsoftOAuthProperties.getFrontendErrorRedirectUri();
        }
        if (provider == RecruiterIntegrationProvider.ZOOM) {
            return zoomOAuthProperties.getFrontendRedirectUri();
        }
        return googleOAuthProperties.getFrontendRedirectUri();
    }

    static String resolveAuthorizationCode(HttpServletRequest request, String requestParamCode) {
        String fromRequestParam = firstNonBlank(requestParamCode, null);
        if (fromRequestParam != null) {
            return fromRequestParam;
        }

        String fromRawQuery = extractRawQueryParam(request.getQueryString(), "code");
        if (fromRawQuery != null) {
            return fromRawQuery;
        }

        OAuthCallbackParams params = resolveOAuthCallbackParams(request, requestParamCode, null, null);
        return firstNonBlank(params.code(), null);
    }

    static String buildCallbackUrl(HttpServletRequest request) {
        StringBuilder url = new StringBuilder(request.getRequestURL());
        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isBlank()) {
            url.append('?').append(queryString);
        }
        return url.toString();
    }

    static String extractRawQueryParam(String queryString, String paramName) {
        if (queryString == null || queryString.isBlank() || paramName == null || paramName.isBlank()) {
            return null;
        }
        for (String pair : queryString.split("&")) {
            int separator = pair.indexOf('=');
            if (separator <= 0) {
                continue;
            }
            String key = pair.substring(0, separator);
            if (!paramName.equals(key)) {
                continue;
            }
            String rawValue = pair.substring(separator + 1);
            return decodeOAuthQueryValue(rawValue);
        }
        return null;
    }

    private static String decodeOAuthQueryValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        StringBuilder decoded = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current == '%' && index + 2 < value.length()) {
                decoded.append((char) Integer.parseInt(value.substring(index + 1, index + 3), 16));
                index += 2;
            } else {
                decoded.append(current);
            }
        }
        return decoded.toString().trim();
    }

    static UUID resolveZoomOAuthRecruiterId(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Object recruiterId = session.getAttribute(ZOOM_OAUTH_RECRUITER_ID_SESSION_ATTR);
        if (recruiterId instanceof UUID uuid) {
            return uuid;
        }
        if (recruiterId instanceof String value && !value.isBlank()) {
            try {
                return UUID.fromString(value.trim());
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    static OAuthCallbackParams resolveOAuthCallbackParams(
        HttpServletRequest request,
        String code,
        String state,
        String error
    ) {
        Map<String, String> queryParams = extractCallbackParameters(request);
        String resolvedCode = firstNonBlank(code, queryParams.get("code"));
        String resolvedState = firstNonBlank(state, queryParams.get("state"));
        String resolvedError = firstNonBlank(error, queryParams.get("error"));
        return new OAuthCallbackParams(resolvedCode, resolvedState, resolvedError);
    }

    private static Map<String, String> extractCallbackParameters(HttpServletRequest request) {
        Map<String, String> params = new java.util.LinkedHashMap<>();
        Map<String, String[]> parameterMap = request.getParameterMap();
        if (parameterMap != null) {
            parameterMap.forEach((key, values) -> params.put(key, firstArrayValue(values)));
        }

        String queryString = request.getQueryString();
        if (queryString != null && !queryString.isBlank()) {
            UriComponentsBuilder.fromUriString("?" + queryString)
                .build()
                .getQueryParams()
                .forEach((key, values) -> params.putIfAbsent(key, values.isEmpty() ? "" : values.get(0)));
        }

        return params;
    }

    private static String firstArrayValue(String[] values) {
        if (values == null || values.length == 0) {
            return null;
        }
        return values[0];
    }

    private static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
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

    static String resolveZoomOAuthState(HttpServletRequest request, String queryState) {
        String resolved = firstNonBlank(queryState, null);
        if (resolved != null) {
            return resolved;
        }

        var session = request.getSession(false);
        if (session != null) {
            Object sessionState = session.getAttribute(ZOOM_OAUTH_STATE_SESSION_ATTR);
            if (sessionState instanceof String value && !value.isBlank()) {
                return value.trim();
            }
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (ZOOM_OAUTH_STATE_COOKIE.equals(cookie.getName())) {
                return firstNonBlank(cookie.getValue(), null);
            }
        }
        return null;
    }

    private static void clearZoomOAuthSessionState(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) {
            session.removeAttribute(ZOOM_OAUTH_STATE_SESSION_ATTR);
            session.removeAttribute(ZOOM_OAUTH_RECRUITER_ID_SESSION_ATTR);
        }
    }

    private static ResponseCookie buildZoomOAuthStateCookie(String state) {
        return ResponseCookie.from(ZOOM_OAUTH_STATE_COOKIE, state)
            .path(ZOOM_OAUTH_STATE_COOKIE_PATH)
            .maxAge(Duration.ofMinutes(15))
            .httpOnly(true)
            .sameSite("Lax")
            .build();
    }

    private static ResponseCookie buildZoomOAuthStateClearCookie() {
        return ResponseCookie.from(ZOOM_OAUTH_STATE_COOKIE, "")
            .path(ZOOM_OAUTH_STATE_COOKIE_PATH)
            .maxAge(Duration.ZERO)
            .httpOnly(true)
            .sameSite("Lax")
            .build();
    }

    private static ResponseEntity<Void> withZoomOAuthCookieCleared(ResponseEntity<Void> response) {
        HttpHeaders headers = new HttpHeaders();
        headers.putAll(response.getHeaders());
        headers.add(HttpHeaders.SET_COOKIE, buildZoomOAuthStateClearCookie().toString());
        return new ResponseEntity<>(headers, response.getStatusCode());
    }

    record OAuthCallbackParams(String code, String state, String error) {}

    private RecruiterIntegration requireConnected(java.util.UUID recruiterId, RecruiterIntegrationProvider provider) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, provider)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, providerLabel(provider) + " is not connected"));

        if (!integration.isConnected() || integration.getAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, providerLabel(provider) + " is not connected");
        }
        return integration;
    }

    private ResponseEntity<IntegrationTestConnectionResponse> okResponse(
        RecruiterIntegrationProvider provider,
        RecruiterIntegration integration,
        String message
    ) {
        return ResponseEntity.ok(
            new IntegrationTestConnectionResponse(true, message, integration.getConnectedEmail())
        );
    }

    private String providerLabel(RecruiterIntegrationProvider provider) {
        switch (provider) {
            case GOOGLE_CALENDAR:
                return "Google Calendar";
            case ZOOM:
                return "Zoom";
            case MICROSOFT_TEAMS:
                return "Microsoft Teams";
            default:
                return provider.name();
        }
    }
}
