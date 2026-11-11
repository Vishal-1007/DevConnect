package com.developersconnect.payment;

import com.developersconnect.payment.dto.CreateRazorpayOrderRequest;
import com.developersconnect.payment.dto.PaymentResponse;
import com.developersconnect.payment.dto.RazorpayOrderResponse;
import com.developersconnect.payment.dto.VerifyRazorpayPaymentRequest;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.service.RazorpayService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments/razorpay")
public class RazorpayController {

    private final RazorpayService razorpayService;

    public RazorpayController(RazorpayService razorpayService) {
        this.razorpayService = razorpayService;
    }

    @PostMapping("/orders")
    public ResponseEntity<RazorpayOrderResponse> createOrder(
        Authentication authentication,
        @Valid @RequestBody CreateRazorpayOrderRequest request
    ) {
        ensureEnabled();
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(razorpayService.createOrder(principal.accountId(), request));
    }

    @PostMapping("/verify")
    public ResponseEntity<PaymentResponse> verify(
        Authentication authentication,
        @Valid @RequestBody VerifyRazorpayPaymentRequest request
    ) {
        ensureEnabled();
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(razorpayService.verifyAndCapture(principal.accountId(), request));
    }

    private void ensureEnabled() {
        if (!razorpayService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Razorpay is not configured");
        }
    }
}
