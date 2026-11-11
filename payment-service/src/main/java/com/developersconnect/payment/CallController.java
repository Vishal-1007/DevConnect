package com.developersconnect.payment;

import com.developersconnect.payment.dto.CallSessionResponse;
import com.developersconnect.payment.dto.StartCallRequest;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.service.CallBillingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/calls")
public class CallController {

    private final CallBillingService callBillingService;

    public CallController(CallBillingService callBillingService) {
        this.callBillingService = callBillingService;
    }

    @PostMapping("/start")
    public ResponseEntity<CallSessionResponse> start(
        Authentication authentication,
        @Valid @RequestBody StartCallRequest request
    ) {
        UUID userId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(callBillingService.startCall(userId, request));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<CallSessionResponse> end(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(callBillingService.endCall(userId, id));
    }

    @PostMapping("/{id}/deduct")
    public ResponseEntity<CallSessionResponse> deduct(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(callBillingService.deductMinute(userId, id));
    }

    @GetMapping("/history")
    public ResponseEntity<List<CallSessionResponse>> history(Authentication authentication) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(callBillingService.history(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CallSessionResponse> get(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(callBillingService.getCall(userId, id));
    }

    private UUID principalId(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return principal.accountId();
    }
}
