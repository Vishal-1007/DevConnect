package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.PaymentServiceProperties;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentVerificationService {

    private final RestTemplate restTemplate;
    private final PaymentServiceProperties paymentServiceProperties;

    public PaymentVerificationService(RestTemplate restTemplate, PaymentServiceProperties paymentServiceProperties) {
        this.restTemplate = restTemplate;
        this.paymentServiceProperties = paymentServiceProperties;
    }

    public void verifyCompletedPurchase(UUID learnerId, UUID paymentId, int expectedAmountCents, String currency) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Api-Key", paymentServiceProperties.internalApiKey());

            VerifyPurchaseRequest body = new VerifyPurchaseRequest(
                learnerId,
                paymentId,
                java.math.BigDecimal.valueOf(expectedAmountCents).movePointLeft(2),
                currency != null ? currency.toUpperCase() : "INR"
            );

            VerifyPurchaseResponse response = restTemplate.postForObject(
                paymentServiceProperties.baseUrl() + "/api/payments/internal/verify-purchase",
                new HttpEntity<>(body, headers),
                VerifyPurchaseResponse.class
            );

            if (response == null || !response.valid()) {
                throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Payment verification failed");
            }
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not verify payment with payment service");
        }
    }

    private record VerifyPurchaseRequest(UUID userId, UUID paymentId, BigDecimal amount, String currency) {}

    private record VerifyPurchaseResponse(boolean valid, String status) {}
}
