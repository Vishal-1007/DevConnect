package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.AdminRecruiterSubscriptionResponse;
import com.developersconnect.payment.dto.AdminUpdateRecruiterSubscriptionRequest;
import com.developersconnect.payment.dto.ConfirmRecruiterUpgradeRequest;
import com.developersconnect.payment.dto.CreateRazorpayOrderRequest;
import com.developersconnect.payment.dto.RazorpayOrderResponse;
import com.developersconnect.payment.dto.RecruiterSubscriptionResponse;
import com.developersconnect.payment.dto.RecruiterUsageMetricResponse;
import com.developersconnect.payment.dto.RecruiterUsageResponse;
import com.developersconnect.payment.dto.VerifyRazorpayPaymentRequest;
import com.developersconnect.payment.model.RecruiterPlanType;
import com.developersconnect.payment.model.RecruiterSubscription;
import com.developersconnect.payment.model.RecruiterSubscriptionStatus;
import com.developersconnect.payment.model.RecruiterUsageAction;
import com.developersconnect.payment.repository.RecruiterSubscriptionRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecruiterSubscriptionService {

    private final RecruiterSubscriptionRepository repository;
    private final RazorpayService razorpayService;

    public RecruiterSubscriptionService(
        RecruiterSubscriptionRepository repository,
        RazorpayService razorpayService
    ) {
        this.repository = repository;
        this.razorpayService = razorpayService;
    }

    @Transactional(readOnly = true)
    public RecruiterSubscriptionResponse getSubscription(UUID recruiterId) {
        return toResponse(ensureActive(resolveSubscription(recruiterId)));
    }

    @Transactional
    public RecruiterSubscriptionResponse consumeUsage(UUID recruiterId, RecruiterUsageAction action) {
        RecruiterSubscription subscription = ensureActive(resolveSubscription(recruiterId));
        resetMonthlyUsageIfNeeded(subscription);
        assertUsageAllowed(subscription, action);
        incrementUsage(subscription, action);
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional(readOnly = true)
    public void assertFeature(UUID recruiterId, String feature) {
        RecruiterSubscription subscription = ensureActive(resolveSubscription(recruiterId));
        if (!RecruiterPlanConfig.hasFeature(subscription.getPlanType(), normalizeFeature(feature))) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Upgrade your plan to access " + feature
            );
        }
    }

    @Transactional
    public RazorpayOrderResponse createUpgradeOrder(UUID recruiterId, RecruiterPlanType planType) {
        if (planType == RecruiterPlanType.FREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot purchase the free plan");
        }
        RecruiterPlanConfig.PlanLimits limits = RecruiterPlanConfig.limitsFor(planType);
        if (limits.priceCents() <= 0 && planType != RecruiterPlanType.ENTERPRISE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plan is not purchasable online");
        }
        BigDecimal amount = RecruiterPlanConfig.priceInr(planType);
        return razorpayService.createOrder(
            recruiterId,
            new CreateRazorpayOrderRequest(
                amount,
                "INR",
                "DevConnect " + limits.displayName() + " subscription",
                "recruiter-upgrade-" + planType.name().toLowerCase(Locale.ROOT) + "-" + recruiterId
            )
        );
    }

    @Transactional
    public RecruiterSubscriptionResponse confirmUpgrade(UUID recruiterId, ConfirmRecruiterUpgradeRequest request) {
        if (request.planType() == RecruiterPlanType.FREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upgrade target");
        }
        if (request.orderId() != null && request.paymentId() != null && request.signature() != null) {
            razorpayService.verifyAndCapture(
                recruiterId,
                new VerifyRazorpayPaymentRequest(
                    request.orderId(),
                    request.paymentId(),
                    request.signature(),
                    "Recruiter plan upgrade: " + request.planType(),
                    request.idempotencyKey()
                )
            );
        }
        return upgradePlan(recruiterId, request.planType());
    }

    @Transactional
    public RecruiterSubscriptionResponse upgradePlan(UUID recruiterId, RecruiterPlanType planType) {
        RecruiterSubscription subscription = resolveSubscription(recruiterId);
        applyPlan(subscription, planType);
        subscription.setStatus(RecruiterSubscriptionStatus.ACTIVE);
        subscription.setStartDate(Instant.now());
        subscription.setExpiryDate(RecruiterPlanConfig.defaultExpiry(planType, Instant.now()));
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional
    public RecruiterSubscriptionResponse cancelSubscription(UUID recruiterId) {
        RecruiterSubscription subscription = resolveSubscription(recruiterId);
        applyPlan(subscription, RecruiterPlanType.FREE);
        subscription.setStatus(RecruiterSubscriptionStatus.CANCELLED);
        subscription.setExpiryDate(null);
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional
    public RecruiterSubscriptionResponse adminCancel(UUID subscriptionId) {
        RecruiterSubscription subscription = repository.findById(subscriptionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
        applyPlan(subscription, RecruiterPlanType.FREE);
        subscription.setStatus(RecruiterSubscriptionStatus.CANCELLED);
        subscription.setExpiryDate(null);
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional
    public RecruiterSubscriptionResponse updateActiveJobCount(UUID recruiterId, int activeJobCount) {
        RecruiterSubscription subscription = ensureActive(resolveSubscription(recruiterId));
        subscription.setUsedJobPosts(Math.max(0, activeJobCount));
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional(readOnly = true)
    public List<AdminRecruiterSubscriptionResponse> listAll() {
        return repository.findAll().stream().map(this::toAdminResponse).toList();
    }

    @Transactional
    public RecruiterSubscriptionResponse adminUpdate(UUID subscriptionId, AdminUpdateRecruiterSubscriptionRequest request) {
        RecruiterSubscription subscription = repository.findById(subscriptionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
        applyPlan(subscription, request.planType());
        subscription.setStatus(RecruiterSubscriptionStatus.ACTIVE);
        if (request.expiryDate() != null) {
            subscription.setExpiryDate(request.expiryDate());
        } else {
            subscription.setExpiryDate(RecruiterPlanConfig.defaultExpiry(request.planType(), Instant.now()));
        }
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional
    public RecruiterSubscriptionResponse adminExtend(UUID subscriptionId, int days) {
        RecruiterSubscription subscription = repository.findById(subscriptionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
        Instant base = subscription.getExpiryDate() != null ? subscription.getExpiryDate() : Instant.now();
        subscription.setExpiryDate(base.plusSeconds(days * 86_400L));
        subscription.setStatus(RecruiterSubscriptionStatus.ACTIVE);
        repository.save(subscription);
        return toResponse(subscription);
    }

    @Transactional
    public int processExpiredSubscriptions() {
        List<RecruiterSubscription> expired = repository.findByStatusAndExpiryDateBefore(
            RecruiterSubscriptionStatus.ACTIVE,
            Instant.now()
        );
        for (RecruiterSubscription subscription : expired) {
            applyPlan(subscription, RecruiterPlanType.FREE);
            subscription.setStatus(RecruiterSubscriptionStatus.EXPIRED);
            subscription.setExpiryDate(null);
            repository.save(subscription);
        }
        return expired.size();
    }

    @Transactional
    public int resetMonthlyUsageForAll() {
        List<RecruiterSubscription> all = repository.findAll();
        Instant now = Instant.now();
        int resetCount = 0;
        for (RecruiterSubscription subscription : all) {
            if (shouldResetMonthlyUsage(subscription, now)) {
                subscription.setUsedSearches(0);
                subscription.setUsedMessages(0);
                subscription.setUsedAiReports(0);
                subscription.setUsageResetAt(now);
                repository.save(subscription);
                resetCount++;
            }
        }
        return resetCount;
    }

    private RecruiterSubscription resolveSubscription(UUID recruiterId) {
        return repository.findByRecruiterId(recruiterId).orElseGet(() -> createDefault(recruiterId));
    }

    private RecruiterSubscription createDefault(UUID recruiterId) {
        RecruiterSubscription subscription = new RecruiterSubscription();
        subscription.setRecruiterId(recruiterId);
        applyPlan(subscription, RecruiterPlanType.FREE);
        subscription.setStatus(RecruiterSubscriptionStatus.ACTIVE);
        subscription.setStartDate(Instant.now());
        subscription.setExpiryDate(null);
        subscription.setUsedJobPosts(0);
        subscription.setUsedSearches(0);
        subscription.setUsedMessages(0);
        subscription.setUsedAiReports(0);
        subscription.setUsageResetAt(Instant.now());
        return repository.save(subscription);
    }

    private RecruiterSubscription ensureActive(RecruiterSubscription subscription) {
        if (subscription.getStatus() == RecruiterSubscriptionStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Subscription is cancelled");
        }
        if (subscription.getExpiryDate() != null
            && subscription.getExpiryDate().isBefore(Instant.now())
            && subscription.getPlanType() != RecruiterPlanType.FREE) {
            applyPlan(subscription, RecruiterPlanType.FREE);
            subscription.setStatus(RecruiterSubscriptionStatus.EXPIRED);
            repository.save(subscription);
        }
        resetMonthlyUsageIfNeeded(subscription);
        return subscription;
    }

    private void resetMonthlyUsageIfNeeded(RecruiterSubscription subscription) {
        if (shouldResetMonthlyUsage(subscription, Instant.now())) {
            subscription.setUsedSearches(0);
            subscription.setUsedMessages(0);
            subscription.setUsedAiReports(0);
            subscription.setUsageResetAt(Instant.now());
            repository.save(subscription);
        }
    }

    private boolean shouldResetMonthlyUsage(RecruiterSubscription subscription, Instant now) {
        if (subscription.getUsageResetAt() == null) {
            return true;
        }
        var last = subscription.getUsageResetAt().atZone(ZoneOffset.UTC);
        var current = now.atZone(ZoneOffset.UTC);
        return last.getYear() != current.getYear() || last.getMonthValue() != current.getMonthValue();
    }

    private void applyPlan(RecruiterSubscription subscription, RecruiterPlanType planType) {
        RecruiterPlanConfig.PlanLimits limits = RecruiterPlanConfig.limitsFor(planType);
        subscription.setPlanType(planType);
        subscription.setActiveJobLimit(limits.activeJobLimit());
        subscription.setCandidateSearchLimit(limits.candidateSearchLimit());
        subscription.setMessageLimit(limits.messageLimit());
        subscription.setRecruiterSeatLimit(limits.recruiterSeatLimit());
        subscription.setAiReportLimit(limits.aiReportLimit());
    }

    private void assertUsageAllowed(RecruiterSubscription subscription, RecruiterUsageAction action) {
        switch (action) {
            case JOB_POST -> {
                if (!isWithinLimit(subscription.getUsedJobPosts(), subscription.getActiveJobLimit())) {
                    throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Upgrade your plan to create more jobs"
                    );
                }
            }
            case DECREMENT_JOB_POST -> {
                // no limit check
            }
            case CANDIDATE_SEARCH -> {
                if (!isWithinLimit(subscription.getUsedSearches(), subscription.getCandidateSearchLimit())) {
                    throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Monthly search limit reached. Upgrade to Pro"
                    );
                }
            }
            case MESSAGE -> {
                if (!isWithinLimit(subscription.getUsedMessages(), subscription.getMessageLimit())) {
                    throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Upgrade to continue messaging candidates"
                    );
                }
            }
            case AI_REPORT -> {
                if (!isWithinLimit(subscription.getUsedAiReports(), subscription.getAiReportLimit())) {
                    throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "AI report limit reached. Upgrade your plan"
                    );
                }
            }
        }
    }

    private void incrementUsage(RecruiterSubscription subscription, RecruiterUsageAction action) {
        switch (action) {
            case JOB_POST -> subscription.setUsedJobPosts(subscription.getUsedJobPosts() + 1);
            case DECREMENT_JOB_POST -> subscription.setUsedJobPosts(Math.max(0, subscription.getUsedJobPosts() - 1));
            case CANDIDATE_SEARCH -> subscription.setUsedSearches(subscription.getUsedSearches() + 1);
            case MESSAGE -> subscription.setUsedMessages(subscription.getUsedMessages() + 1);
            case AI_REPORT -> subscription.setUsedAiReports(subscription.getUsedAiReports() + 1);
        }
    }

    private boolean isWithinLimit(int used, int maxAllowed) {
        return RecruiterPlanConfig.isUnlimited(maxAllowed) || used < maxAllowed;
    }

    private String formatRenewal(Instant expiryDate) {
        if (expiryDate == null) {
            return "No expiry";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)
            .withZone(ZoneOffset.UTC);
        return "Valid until " + formatter.format(expiryDate);
    }

    private RecruiterUsageResponse buildUsage(RecruiterSubscription subscription) {
        List<RecruiterUsageMetricResponse> metrics = new ArrayList<>();
        metrics.add(createUsageMetric("searches", "Candidate Searches", subscription.getUsedSearches(), subscription.getCandidateSearchLimit()));
        metrics.add(createUsageMetric("messages", "Messages Sent", subscription.getUsedMessages(), subscription.getMessageLimit()));
        metrics.add(createUsageMetric("jobs", "Job Posts", subscription.getUsedJobPosts(), subscription.getActiveJobLimit()));
        metrics.add(createUsageMetric("ai-reports", "AI Match Reports", subscription.getUsedAiReports(), subscription.getAiReportLimit()));
        return new RecruiterUsageResponse(metrics);
    }

    private RecruiterUsageMetricResponse createUsageMetric(String id, String label, int used, int planLimit) {
        if (RecruiterPlanConfig.isUnlimited(planLimit)) {
            return new RecruiterUsageMetricResponse(id, label, used, -1, "Unlimited");
        }
        return new RecruiterUsageMetricResponse(id, label, used, planLimit, Integer.toString(planLimit));
    }

    private RecruiterSubscriptionResponse toResponse(RecruiterSubscription subscription) {
        RecruiterPlanConfig.PlanLimits limits = RecruiterPlanConfig.limitsFor(subscription.getPlanType());
        String renewalLabel = formatRenewal(subscription.getExpiryDate());
        RecruiterUsageResponse usage = buildUsage(subscription);
        return new RecruiterSubscriptionResponse(
            subscription.getPlanType().name(),
            limits.displayName(),
            subscription.getStatus().name(),
            subscription.getStartDate(),
            subscription.getExpiryDate(),
            renewalLabel,
            usage,
            RecruiterPlanConfig.featureMap(subscription.getPlanType())
        );
    }

    private AdminRecruiterSubscriptionResponse toAdminResponse(RecruiterSubscription subscription) {
        return new AdminRecruiterSubscriptionResponse(
            subscription.getId(),
            subscription.getRecruiterId(),
            subscription.getPlanType(),
            subscription.getStatus().name(),
            subscription.getStartDate(),
            subscription.getExpiryDate(),
            subscription.getUsedJobPosts(),
            subscription.getActiveJobLimit(),
            subscription.getUsedSearches(),
            subscription.getCandidateSearchLimit(),
            subscription.getUsedMessages(),
            subscription.getMessageLimit()
        );
    }

    private String normalizeFeature(String feature) {
        return feature.trim().toUpperCase(Locale.ROOT).replace('-', '_');
    }
}
