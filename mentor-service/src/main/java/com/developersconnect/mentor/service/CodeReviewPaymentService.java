package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.AiReviewProperties;
import com.developersconnect.mentor.dto.CodeReviewDtos.AiReviewUsageResponse;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewOrderResponse;
import com.developersconnect.mentor.model.AiReviewPaymentCredit;
import com.developersconnect.mentor.repository.AiReviewPaymentCreditRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CodeReviewPaymentService {

    private final AiReviewProperties properties;
    private final AiUsageService aiUsageService;
    private final PaymentVerificationService paymentVerificationService;
    private final AiReviewPaymentCreditRepository paymentCreditRepository;

    public CodeReviewPaymentService(
        AiReviewProperties properties,
        AiUsageService aiUsageService,
        PaymentVerificationService paymentVerificationService,
        AiReviewPaymentCreditRepository paymentCreditRepository
    ) {
        this.properties = properties;
        this.aiUsageService = aiUsageService;
        this.paymentVerificationService = paymentVerificationService;
        this.paymentCreditRepository = paymentCreditRepository;
    }

    public CodeReviewOrderResponse createOrder(UUID userId) {
        String idempotencyKey = "code-review-" + userId + "-" + UUID.randomUUID();
        return new CodeReviewOrderResponse(
            properties.getPaidReviewPriceInr(),
            "INR",
            "DevConnect — Extra AI Code Review",
            idempotencyKey,
            properties.getPaidReviewPriceCents()
        );
    }

    @Transactional
    public AiReviewUsageResponse confirmPayment(UUID userId, UUID paymentId) {
        if (paymentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentId is required");
        }
        if (paymentCreditRepository.existsByPaymentId(paymentId)) {
            return aiUsageService.getUsage(userId);
        }

        paymentVerificationService.verifyCompletedPurchase(
            userId,
            paymentId,
            properties.getPaidReviewPriceCents(),
            "INR"
        );

        aiUsageService.creditPaidReview(userId, 1);

        AiReviewPaymentCredit credit = new AiReviewPaymentCredit();
        credit.setUserId(userId);
        credit.setPaymentId(paymentId);
        paymentCreditRepository.save(credit);

        return aiUsageService.getUsage(userId);
    }
}
