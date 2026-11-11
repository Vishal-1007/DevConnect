package com.developersconnect.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.microsoft")
public class MicrosoftOAuthProperties {

    private String clientId = "";
    private String clientSecret = "";
    private String tenant = "common";
    private String redirectUri = "http://localhost:8089/api/recruiter/integrations/oauth/teams/callback";
    private String frontendSuccessRedirectUri = "http://localhost:5173/oauth/success";
    private String frontendErrorRedirectUri = "http://localhost:5173/oauth/error";
    private String scopes =
        "openid profile email offline_access User.Read OnlineMeetings.ReadWrite Calendars.ReadWrite";

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

    public String getTenant() {
        return tenant;
    }

    public void setTenant(String tenant) {
        this.tenant = tenant;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
        this.redirectUri = redirectUri;
    }

    public String getFrontendSuccessRedirectUri() {
        return frontendSuccessRedirectUri;
    }

    public void setFrontendSuccessRedirectUri(String frontendSuccessRedirectUri) {
        this.frontendSuccessRedirectUri = frontendSuccessRedirectUri;
    }

    public String getFrontendErrorRedirectUri() {
        return frontendErrorRedirectUri;
    }

    public void setFrontendErrorRedirectUri(String frontendErrorRedirectUri) {
        this.frontendErrorRedirectUri = frontendErrorRedirectUri;
    }

    public String getScopes() {
        return scopes;
    }

    public void setScopes(String scopes) {
        this.scopes = scopes;
    }

    public String authorizationBaseUrl() {
        return "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/authorize";
    }

    public String tokenUrl() {
        return "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/token";
    }
}
