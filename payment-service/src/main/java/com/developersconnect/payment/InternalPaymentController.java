package com.developersconnect.payment;

import com.developersconnect.payment.config.InternalApiProperties;
import com.developersconnect.payment.dto.InternalVerifyPurchaseRequest;
import com.developersconnect.payment.dto.InternalVerifyPurchaseResponse;
import com.developersconnect.payment.model.Payment;
import com.developersconnect.payment.model.PaymentStatus;
import com.developersconnect.payment.repository.PaymentRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments/internal")
public class InternalPaymentController {

    private final PaymentRepository paymentRepository;
    private final InternalApiProperties internalApiProperties;

    public InternalPaymentController(
        PaymentRepository paymentRepository,
        InternalApiProperties internalApiProperties
    ) {
        this.paymentRepository = paymentRepository;
        this.internalApiProperties = internalApiProperties;
    }

    @PostMapping("/verify-purchase")
    public InternalVerifyPurchaseResponse verifyPurchase(
        @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
        @Valid @RequestBody InternalVerifyPurchaseRequest request
    ) {
        assertInternalKey(apiKey);

        Payment payment = paymentRepository.findById(request.paymentId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        if (!payment.getUserId().equals(request.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payment does not belong to user");
        }

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            return new InternalVerifyPurchaseResponse(false, payment.getStatus().name());
        }

        String expectedCurrency = request.currency() != null
            ? request.currency().toUpperCase(Locale.ROOT)
            : payment.getCurrency();
        if (!payment.getCurrency().equalsIgnoreCase(expectedCurrency)) {
            return new InternalVerifyPurchaseResponse(false, "CURRENCY_MISMATCH");
        }

        BigDecimal expected = request.amount() != null ? request.amount() : BigDecimal.ZERO;
        if (payment.getAmount().compareTo(expected) < 0) {
            return new InternalVerifyPurchaseResponse(false, "AMOUNT_MISMATCH");
        }

        return new InternalVerifyPurchaseResponse(true, payment.getStatus().name());
    }

    private void assertInternalKey(String apiKey) {
        if (apiKey == null || !apiKey.equals(internalApiProperties.apiKey())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API key");
        }
    }
}
