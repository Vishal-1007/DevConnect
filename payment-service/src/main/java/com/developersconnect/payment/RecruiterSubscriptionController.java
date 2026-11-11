package com.developersconnect.payment;

import com.developersconnect.payment.dto.ConfirmRecruiterUpgradeRequest;
import com.developersconnect.payment.dto.ConsumeRecruiterUsageRequest;
import com.developersconnect.payment.dto.RecruiterSubscriptionResponse;
import com.developersconnect.payment.dto.SyncRecruiterJobCountRequest;
import com.developersconnect.payment.model.RecruiterPlanType;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.security.RecruiterAuth;
import com.developersconnect.payment.service.RecruiterSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments/recruiter/subscription")
public class RecruiterSubscriptionController {

    private final RecruiterSubscriptionService subscriptionService;

    public RecruiterSubscriptionController(RecruiterSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<RecruiterSubscriptionResponse> getSubscription(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(subscriptionService.getSubscription(principal.accountId()));
    }

    @PostMapping("/usage/consume")
    public ResponseEntity<RecruiterSubscriptionResponse> consumeUsage(
        Authentication authentication,
        @Valid @RequestBody ConsumeRecruiterUsageRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(subscriptionService.consumeUsage(principal.accountId(), request.action()));
    }

    @GetMapping("/features/{feature}")
    public ResponseEntity<Void> checkFeature(
        Authentication authentication,
        @PathVariable String feature
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        subscriptionService.assertFeature(principal.accountId(), feature);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upgrade/order")
    public ResponseEntity<?> createUpgradeOrder(
        Authentication authentication,
        @RequestParam RecruiterPlanType planType
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        if (planType == RecruiterPlanType.ENTERPRISE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact sales for Enterprise pricing");
        }
        return ResponseEntity.ok(subscriptionService.createUpgradeOrder(principal.accountId(), planType));
    }

    @PostMapping("/upgrade/confirm")
    public ResponseEntity<RecruiterSubscriptionResponse> confirmUpgrade(
        Authentication authentication,
        @Valid @RequestBody ConfirmRecruiterUpgradeRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(subscriptionService.confirmUpgrade(principal.accountId(), request));
    }

    @PostMapping("/sync-jobs")
    public ResponseEntity<RecruiterSubscriptionResponse> syncJobs(
        Authentication authentication,
        @Valid @RequestBody SyncRecruiterJobCountRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(
            subscriptionService.updateActiveJobCount(principal.accountId(), request.activeJobCount())
        );
    }

    @PostMapping("/cancel")
    public ResponseEntity<RecruiterSubscriptionResponse> cancel(Authentication authentication) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(subscriptionService.cancelSubscription(principal.accountId()));
    }
}
