package com.developersconnect.payment;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.payment.dto.CheckoutPaymentRequest;
import com.developersconnect.payment.dto.ConfirmPaymentRequest;
import com.developersconnect.payment.dto.CreatePaymentIntentRequest;
import com.developersconnect.payment.dto.PaymentConfigResponse;
import com.developersconnect.payment.dto.PaymentModeOptionResponse;
import com.developersconnect.payment.dto.PaymentResponse;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.service.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/config")
    public ResponseEntity<PaymentConfigResponse> getConfig() {
        return ResponseEntity.ok(paymentService.getConfig());
    }

    @GetMapping("/modes")
    public ResponseEntity<List<PaymentModeOptionResponse>> getPaymentModes() {
        return ResponseEntity.ok(paymentService.listPaymentModes());
    }

   
    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> checkout(
        Authentication authentication,
        @Valid @RequestBody CheckoutPaymentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.checkout(principal.accountId(), request));
    }

    /**
     * Step 1 of the payment saga — reserve funds with the gateway (authorize).
     */
    @PostMapping("/intents")
    public ResponseEntity<PaymentResponse> createIntent(
        Authentication authentication,
        @Valid @RequestBody CreatePaymentIntentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        PaymentResponse response = paymentService.createIntent(principal.accountId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Step 2 of the payment saga — capture authorized funds and emit Kafka notification event.
     */
    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(
        Authentication authentication,
        @PathVariable UUID paymentId,
        @RequestBody(required = false) ConfirmPaymentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.confirm(principal.accountId(), paymentId, request));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(
        Authentication authentication,
        @PathVariable UUID paymentId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.findById(principal.accountId(), paymentId));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> listPayments(
        Authentication authentication,
        @RequestParam(defaultValue = "20") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.listPayments(principal.accountId(), limit));
    }
}
