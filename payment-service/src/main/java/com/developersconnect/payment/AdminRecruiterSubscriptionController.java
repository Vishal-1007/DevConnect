package com.developersconnect.payment;

import com.developersconnect.payment.dto.AdminRecruiterSubscriptionResponse;
import com.developersconnect.payment.dto.AdminUpdateRecruiterSubscriptionRequest;
import com.developersconnect.payment.dto.RecruiterSubscriptionResponse;
import com.developersconnect.payment.service.RecruiterSubscriptionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/admin/recruiter-subscriptions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRecruiterSubscriptionController {

    private final RecruiterSubscriptionService subscriptionService;

    public AdminRecruiterSubscriptionController(RecruiterSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<List<AdminRecruiterSubscriptionResponse>> list() {
        return ResponseEntity.ok(subscriptionService.listAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecruiterSubscriptionResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody AdminUpdateRecruiterSubscriptionRequest request
    ) {
        return ResponseEntity.ok(subscriptionService.adminUpdate(id, request));
    }

    @PostMapping("/{id}/extend")
    public ResponseEntity<RecruiterSubscriptionResponse> extend(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(subscriptionService.adminExtend(id, days));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RecruiterSubscriptionResponse> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(subscriptionService.adminCancel(id));
    }
}
