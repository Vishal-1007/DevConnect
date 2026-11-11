package com.developersconnect.payment.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ZoomOAuthServiceAuthorizationUrlTest {

    private static final String REDIRECT_URI =
        "http://lvh.me:8089/api/recruiter/integrations/oauth/zoom/callback";

    @Test
    void buildZoomAuthorizeUrlEncodesRedirectUriAndOmitsScopeParameter() {
        String url = ZoomOAuthService.buildZoomAuthorizeUrl(
            "fk4hD4iFSGSx4kJgLdMEDg",
            REDIRECT_URI,
            "test-state"
        );

        assertThat(url)
            .startsWith("https://zoom.us/oauth/authorize?")
            .contains("redirect_uri=http%3A%2F%2Flvh.me%3A8089%2Fapi%2Frecruiter%2Fintegrations%2Foauth%2Fzoom%2Fcallback")
            .contains("state=test-state")
            .doesNotContain("redirect_uri=http://lvh.me")
            .doesNotContain("scope=");
    }
}
