package com.developersconnect.payment;

import com.developersconnect.payment.dto.CallSessionResponse;
import com.developersconnect.payment.dto.MarketplaceConfigResponse;
import com.developersconnect.payment.dto.UpdateMarketplaceConfigRequest;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.service.CallBillingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/marketplace")
public class MarketplaceAdminController {

    private final CallBillingService callBillingService;

    public MarketplaceAdminController(CallBillingService callBillingService) {
        this.callBillingService = callBillingService;
    }

    @GetMapping("/config")
    public ResponseEntity<MarketplaceConfigResponse> getConfig() {
        return ResponseEntity.ok(callBillingService.getConfig());
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarketplaceConfigResponse> updateConfig(
        @Valid @RequestBody UpdateMarketplaceConfigRequest request
    ) {
        return ResponseEntity.ok(callBillingService.updateConfig(request));
    }

    @GetMapping("/mentor/earnings")
    public ResponseEntity<List<CallSessionResponse>> mentorEarnings(Authentication authentication) {
        UUID mentorId = ((AuthPrincipal) authentication.getPrincipal()).accountId();
        return ResponseEntity.ok(callBillingService.mentorHistory(mentorId));
    }
}
