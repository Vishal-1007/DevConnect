package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public class GoogleOAuthProperties {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8089/api/recruiter/integrations/oauth/google/callback";
    private String frontendRedirectUri = "http://localhost:5173/recruiter/oauth/callback";
    private String calendarScope =
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events email profile openid";

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
            && clientSecret != null && !clientSecret.isBlank();
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getFrontendRedirectUri() {
        return frontendRedirectUri;
    }

    public void setFrontendRedirectUri(String frontendRedirectUri) {
        this.frontendRedirectUri = frontendRedirectUri;
    }

    public String getCalendarScope() {
        return calendarScope;
    }

    public void setCalendarScope(String calendarScope) {
        this.calendarScope = calendarScope;
    }
}
