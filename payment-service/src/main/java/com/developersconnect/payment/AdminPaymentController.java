package com.developersconnect.payment;

import com.developersconnect.payment.dto.FinancialTransactionResponse;
import com.developersconnect.payment.dto.MentorPayoutResponse;
import com.developersconnect.payment.dto.PaymentAnalyticsResponse;
import com.developersconnect.payment.dto.PremiumSubscriptionResponse;
import com.developersconnect.payment.service.AdminPaymentService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    public AdminPaymentController(AdminPaymentService adminPaymentService) {
        this.adminPaymentService = adminPaymentService;
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<FinancialTransactionResponse>> listTransactions(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String filter,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminPaymentService.listTransactions(status, type, filter, q, limit));
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<FinancialTransactionResponse> getTransaction(@PathVariable UUID id) {
        return ResponseEntity.ok(adminPaymentService.getTransaction(id));
    }

    @GetMapping("/analytics")
    public ResponseEntity<PaymentAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminPaymentService.getAnalytics());
    }

    @GetMapping("/payouts")
    public ResponseEntity<List<MentorPayoutResponse>> payouts(
        @RequestParam(defaultValue = "all") String status
    ) {
        return ResponseEntity.ok(adminPaymentService.listPayouts(status));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<List<PremiumSubscriptionResponse>> subscriptions() {
        return ResponseEntity.ok(adminPaymentService.listSubscriptions());
    }

    @PostMapping("/transactions/{id}/refund")
    public ResponseEntity<FinancialTransactionResponse> refund(@PathVariable UUID id) {
        return ResponseEntity.ok(adminPaymentService.processRefund(id));
    }

    @PostMapping("/transactions/{id}/retry")
    public ResponseEntity<FinancialTransactionResponse> retry(@PathVariable UUID id) {
        return ResponseEntity.ok(adminPaymentService.retryFailedPayment(id));
    }

    @PostMapping("/payouts/{id}/process")
    public ResponseEntity<MentorPayoutResponse> processPayout(@PathVariable UUID id) {
        return ResponseEntity.ok(adminPaymentService.processPayout(id));
    }
}
