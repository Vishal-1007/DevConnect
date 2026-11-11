package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.zoom")
public class ZoomOAuthProperties {

    private static final String EMPTY = "";

    private String clientId;
    private String clientSecret;
    private String redirectUri = "http://lvh.me:8089/api/recruiter/integrations/oauth/zoom/callback";
    private String frontendRedirectUri = "http://localhost:5173/recruiter/oauth/callback";
    private String scopes =
        "meeting:write:meeting meeting:update:meeting meeting:read:meeting user:read:user";

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank();
    }

    public String getClientId() {
        return clientId == null ? EMPTY : clientId.trim();
    }

    public void setClientId(String clientId) {
        this.clientId = clientId == null ? EMPTY : clientId.trim();
    }

    public String getClientSecret() {
        return clientSecret == null ? EMPTY : clientSecret.trim();
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret == null ? EMPTY : clientSecret.trim();
    }

    public String getRedirectUri() {
        return normalizeRedirectUri(redirectUri);
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = normalizeRedirectUri(redirectUri);
    }

    public String getFrontendRedirectUri() {
        return frontendRedirectUri == null ? EMPTY : frontendRedirectUri.trim();
    }

    public void setFrontendRedirectUri(String frontendRedirectUri) {
        this.frontendRedirectUri = frontendRedirectUri == null ? EMPTY : frontendRedirectUri.trim();
    }

    public String getScopes() {
        return scopes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    /** Bridge URL on the same host as the OAuth callback (e.g. lvh.me) for state cookie setup. */
    public String getOAuthBridgeUri() {
        String callback = getRedirectUri();
        if (callback.endsWith("/callback")) {
            return callback.substring(0, callback.length() - "/callback".length()) + "/bridge";
        }
        return callback + "/bridge";
    }

    /** Zoom requires redirect_uri to match the Marketplace app exactly (no trailing slash). */
    static String normalizeRedirectUri(String uri) {
        if (uri == null) {
            return EMPTY;
        }
        String normalized = uri.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }
}
