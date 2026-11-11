package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.AiReviewProperties;
import com.developersconnect.mentor.dto.CodeReviewDtos.AiReviewUsageResponse;
import com.developersconnect.mentor.model.AiReviewUsage;
import com.developersconnect.mentor.repository.AiReviewUsageRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiUsageService {

    public static final String PAYMENT_REQUIRED_CODE = "PAYMENT_REQUIRED";

    private final AiReviewUsageRepository usageRepository;
    private final AiReviewProperties properties;

    public AiUsageService(AiReviewUsageRepository usageRepository, AiReviewProperties properties) {
        this.usageRepository = usageRepository;
        this.properties = properties;
    }

    public int freeDailyLimit() {
        return properties.getFreeDailyLimit();
    }

    @Transactional(readOnly = true)
    public AiReviewUsageResponse getUsage(UUID userId) {
        return findTodayUsage(userId)
            .map(this::toResponse)
            .orElseGet(this::defaultUsageResponse);
    }

    @Transactional(readOnly = true)
    public boolean canAnalyze(UUID userId) {
        return findTodayUsage(userId)
            .map(usage -> usage.getPaidReviewsAvailable() > 0
                || usage.getFreeReviewsUsed() < properties.getFreeDailyLimit())
            .orElse(true);
    }

    private Optional<AiReviewUsage> findTodayUsage(UUID userId) {
        LocalDate today = LocalDate.now(ZoneId.of(properties.getUsageZone()));
        return usageRepository.findByUserIdAndReviewDate(userId, today);
    }

    private AiReviewUsageResponse defaultUsageResponse() {
        int limit = properties.getFreeDailyLimit();
        LocalDate today = LocalDate.now(ZoneId.of(properties.getUsageZone()));
        return new AiReviewUsageResponse(limit, 0, limit, 0, today.toString());
    }

    public enum ReviewConsumption { FREE, PAID }

    /**
     * Reserves one review credit before calling AI. Call {@link #releaseReservedReview} on AI failure.
     */
    @Transactional
    public ReviewConsumption reserveReview(UUID userId) {
        AiReviewUsage usage = getOrCreateToday(userId);
        if (usage.getPaidReviewsAvailable() > 0) {
            usage.setPaidReviewsAvailable(usage.getPaidReviewsAvailable() - 1);
            usageRepository.save(usage);
            return ReviewConsumption.PAID;
        }
        if (usage.getFreeReviewsUsed() >= properties.getFreeDailyLimit()) {
            throw paymentRequired(usage);
        }
        usage.setFreeReviewsUsed(usage.getFreeReviewsUsed() + 1);
        usageRepository.save(usage);
        return ReviewConsumption.FREE;
    }

    @Transactional
    public void releaseReservedReview(UUID userId, ReviewConsumption consumption) {
        if (consumption == null) return;
        AiReviewUsage usage = getOrCreateToday(userId);
        if (consumption == ReviewConsumption.PAID) {
            usage.setPaidReviewsAvailable(usage.getPaidReviewsAvailable() + 1);
        } else {
            usage.setFreeReviewsUsed(Math.max(0, usage.getFreeReviewsUsed() - 1));
        }
        usageRepository.save(usage);
    }

    @Transactional
    public void creditPaidReview(UUID userId, int count) {
        if (count <= 0) return;
        AiReviewUsage usage = getOrCreateToday(userId);
        usage.setPaidReviewsAvailable(usage.getPaidReviewsAvailable() + count);
        usageRepository.save(usage);
    }

    private ResponseStatusException paymentRequired(AiReviewUsage usage) {
        return new ResponseStatusException(
            HttpStatus.PAYMENT_REQUIRED,
            PAYMENT_REQUIRED_CODE + ": Daily free AI review limit reached"
        ) {
            @Override
            public String getReason() {
                return PAYMENT_REQUIRED_CODE;
            }
        };
    }

    public AiReviewUsageResponse toResponse(AiReviewUsage usage) {
        int limit = properties.getFreeDailyLimit();
        int used = usage.getFreeReviewsUsed();
        int remaining = Math.max(0, limit - used);
        return new AiReviewUsageResponse(
            limit,
            used,
            remaining,
            usage.getPaidReviewsAvailable(),
            usage.getReviewDate().toString()
        );
    }

    @Transactional
    public AiReviewUsage getOrCreateToday(UUID userId) {
        LocalDate today = LocalDate.now(ZoneId.of(properties.getUsageZone()));
        return usageRepository.findByUserIdAndReviewDate(userId, today)
            .orElseGet(() -> {
                AiReviewUsage row = new AiReviewUsage();
                row.setUserId(userId);
                row.setReviewDate(today);
                row.setFreeReviewsUsed(0);
                row.setPaidReviewsAvailable(0);
                return usageRepository.save(row);
            });
    }
}
