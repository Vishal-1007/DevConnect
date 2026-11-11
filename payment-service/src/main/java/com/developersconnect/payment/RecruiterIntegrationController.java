package com.developersconnect.payment;

import com.developersconnect.payment.dto.ConnectRecruiterIntegrationRequest;
import com.developersconnect.payment.dto.RecruiterIntegrationResponse;
import com.developersconnect.payment.dto.RecruiterIntegrationSyncSettingsResponse;
import com.developersconnect.payment.dto.UpdateRecruiterIntegrationSyncSettingsRequest;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.security.RecruiterAuth;
import com.developersconnect.payment.service.RecruiterIntegrationService;
import com.developersconnect.payment.service.RecruiterIntegrationSyncSettingsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiter/integrations")
public class RecruiterIntegrationController {

    private final RecruiterIntegrationService integrationService;
    private final RecruiterIntegrationSyncSettingsService syncSettingsService;

    public RecruiterIntegrationController(
        RecruiterIntegrationService integrationService,
        RecruiterIntegrationSyncSettingsService syncSettingsService
    ) {
        this.integrationService = integrationService;
        this.syncSettingsService = syncSettingsService;
    }

    @GetMapping
    public ResponseEntity<List<RecruiterIntegrationResponse>> listIntegrations(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(integrationService.listIntegrations(principal.accountId()));
    }

    @PostMapping("/connect/{provider}")
    public ResponseEntity<RecruiterIntegrationResponse> connect(
        Authentication authentication,
        @PathVariable RecruiterIntegrationProvider provider,
        @RequestBody(required = false) ConnectRecruiterIntegrationRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(
            integrationService.connect(principal.accountId(), principal, provider, request)
        );
    }

    @GetMapping("/{provider}/settings")
    public ResponseEntity<RecruiterIntegrationSyncSettingsResponse> getSyncSettings(
        Authentication authentication,
        @PathVariable RecruiterIntegrationProvider provider
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(syncSettingsService.getSyncSettings(principal.accountId(), provider));
    }

    @PutMapping("/{provider}/settings")
    public ResponseEntity<RecruiterIntegrationSyncSettingsResponse> updateSyncSettings(
        Authentication authentication,
        @PathVariable RecruiterIntegrationProvider provider,
        @RequestBody UpdateRecruiterIntegrationSyncSettingsRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(
            syncSettingsService.updateSyncSettings(
                principal.accountId(),
                provider,
                request.settings()
            )
        );
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> disconnect(
        Authentication authentication,
        @PathVariable RecruiterIntegrationProvider provider
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        integrationService.disconnect(principal.accountId(), provider);
        return ResponseEntity.noContent().build();
    }
}
