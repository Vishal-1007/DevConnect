package com.developersconnect.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class IntegrationOAuthControllerCallbackTest {

    @Test
    void resolveOAuthCallbackParamsReadsQueryParameters() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setQueryString("code=auth-code-123&state=state-token-456");

        IntegrationOAuthController.OAuthCallbackParams params =
            IntegrationOAuthController.resolveOAuthCallbackParams(request, null, null, null);

        assertThat(params.code()).isEqualTo("auth-code-123");
        assertThat(params.state()).isEqualTo("state-token-456");
    }

    @Test
    void resolveOAuthCallbackParamsReadsFormBodyForPostCallback() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setContentType("application/x-www-form-urlencoded");
        request.setParameter("code", "auth-code-789");
        request.setParameter("state", "state-token-abc");

        IntegrationOAuthController.OAuthCallbackParams params =
            IntegrationOAuthController.resolveOAuthCallbackParams(request, null, null, null);

        assertThat(params.code()).isEqualTo("auth-code-789");
        assertThat(params.state()).isEqualTo("state-token-abc");
    }

    @Test
    void resolveOAuthCallbackParamsPrefersExplicitRequestParams() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setParameter("code", "from-request");
        request.setParameter("state", "from-state");

        IntegrationOAuthController.OAuthCallbackParams params =
            IntegrationOAuthController.resolveOAuthCallbackParams(request, "from-method", "from-method-state", null);

        assertThat(params.code()).isEqualTo("from-method");
        assertThat(params.state()).isEqualTo("from-method-state");
    }

    @Test
    void resolveZoomOAuthStateFallsBackToSessionWhenQueryStateMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setQueryString("code=auth-code-123");
        request.getSession(true).setAttribute("dc_zoom_oauth_state", "session-state-token");

        String state = IntegrationOAuthController.resolveZoomOAuthState(request, null);

        assertThat(state).isEqualTo("session-state-token");
    }

    @Test
    void resolveZoomOAuthStateFallsBackToCookieWhenQueryAndSessionMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setQueryString("code=auth-code-123");
        request.setCookies(new jakarta.servlet.http.Cookie("dc_zoom_oauth_state", "cookie-state-token"));

        String state = IntegrationOAuthController.resolveZoomOAuthState(request, null);

        assertThat(state).isEqualTo("cookie-state-token");
    }

    @Test
    void resolveAuthorizationCodeReadsRawQueryStringWithoutConvertingPlusToSpace() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setQueryString("code=abc%2Bdef-123");

        String code = IntegrationOAuthController.resolveAuthorizationCode(request, null);

        assertThat(code).isEqualTo("abc+def-123");
    }

    @Test
    void resolveAuthorizationCodePreservesPlusWhenTomcatWouldConvertIt() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/recruiter/integrations/oauth/zoom/callback");
        request.setQueryString("code=abc+def-123");

        String code = IntegrationOAuthController.resolveAuthorizationCode(request, null);

        assertThat(code).isEqualTo("abc+def-123");
    }
}
