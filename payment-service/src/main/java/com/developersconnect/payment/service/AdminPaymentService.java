package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.FinancialTransactionResponse;
import com.developersconnect.payment.dto.MentorPayoutResponse;
import com.developersconnect.payment.dto.PaymentAnalyticsResponse;
import com.developersconnect.payment.dto.PaymentAnalyticsResponse.RevenueTrendPoint;
import com.developersconnect.payment.dto.PremiumSubscriptionResponse;
import com.developersconnect.payment.model.FinancialTransaction;
import com.developersconnect.payment.model.MentorPayout;
import com.developersconnect.payment.model.Payment;
import com.developersconnect.payment.model.PaymentStatus;
import com.developersconnect.payment.model.PremiumSubscription;
import com.developersconnect.payment.repository.FinancialTransactionRepository;
import com.developersconnect.payment.repository.MentorPayoutRepository;
import com.developersconnect.payment.repository.PaymentRepository;
import com.developersconnect.payment.repository.PremiumSubscriptionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminPaymentService {

    private static final int COMMISSION_BPS = 3000; // 30% platform commission

    private final FinancialTransactionRepository transactionRepository;
    private final MentorPayoutRepository payoutRepository;
    private final PremiumSubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;

    public AdminPaymentService(
        FinancialTransactionRepository transactionRepository,
        MentorPayoutRepository payoutRepository,
        PremiumSubscriptionRepository subscriptionRepository,
        PaymentRepository paymentRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.payoutRepository = payoutRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public void syncFromPayments() {
        for (Payment payment : paymentRepository.findAll()) {
            upsertFromPayment(payment);
        }
    }

    @Transactional
    public List<FinancialTransactionResponse> listTransactions(
        String status,
        String type,
        String filter,
        String query,
        int limit
    ) {
        syncFromPayments();
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        String normalizedStatus = normalizeOptional(status);
        String normalizedType = normalizeOptional(type);
        boolean failedOnly = "failed".equalsIgnoreCase(filter);
        boolean refundOnly = "refunds".equalsIgnoreCase(filter);

        return transactionRepository.search(
            normalizedStatus,
            normalizedType,
            failedOnly,
            refundOnly,
            normalizeQuery(query),
            PageRequest.of(0, safeLimit)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FinancialTransactionResponse getTransaction(UUID id) {
        return toResponse(findTransaction(id));
    }

    @Transactional
    public PaymentAnalyticsResponse getAnalytics() {
        syncFromPayments();

        long totalRevenue = transactionRepository.sumPlatformRevenueCents();
        Instant now = Instant.now();
        Instant monthStart = now.atZone(ZoneId.systemDefault()).withDayOfMonth(1).toInstant();
        Instant prevMonthStart = monthStart.minus(30, ChronoUnit.DAYS);
        long monthlyRevenue = transactionRepository.sumRevenueBetween(monthStart, now.plus(1, ChronoUnit.DAYS));
        long prevMonthly = transactionRepository.sumRevenueBetween(prevMonthStart, monthStart);
        double growth = prevMonthly > 0
            ? ((monthlyRevenue - prevMonthly) * 100.0) / prevMonthly
            : (monthlyRevenue > 0 ? 100.0 : 0.0);

        long pendingPayouts = payoutRepository.sumPendingPayoutCents();
        long commission = transactionRepository.findAll().stream()
            .filter(t -> "completed".equals(t.getStatus()))
            .mapToLong(FinancialTransaction::getCommissionCents)
            .sum();

        Map<String, Long> byType = new LinkedHashMap<>();
        for (Object[] row : transactionRepository.countGroupByType()) {
            byType.put((String) row[0], (Long) row[1]);
        }

        return new PaymentAnalyticsResponse(
            totalRevenue,
            formatMoney(totalRevenue),
            monthlyRevenue,
            formatMoney(monthlyRevenue),
            Math.round(growth * 10) / 10.0,
            pendingPayouts,
            formatMoney(pendingPayouts),
            commission,
            formatMoney(commission),
            transactionRepository.count(),
            transactionRepository.countByStatus("failed"),
            transactionRepository.countByStatus("refunded") + byType.getOrDefault("refund", 0L),
            subscriptionRepository.countByStatusAndPremiumTrue("active"),
            subscriptionRepository.countByStatusAndPremiumTrue("active"),
            byType,
            buildRevenueTrend()
        );
    }

    @Transactional(readOnly = true)
    public List<MentorPayoutResponse> listPayouts(String status) {
        List<MentorPayout> payouts = status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)
            ? payoutRepository.findAllByStatusOrderByCreatedAtDesc(status.trim().toLowerCase(Locale.ROOT))
            : payoutRepository.findAllByOrderByCreatedAtDesc();
        return payouts.stream().map(this::toPayoutResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PremiumSubscriptionResponse> listSubscriptions() {
        return subscriptionRepository.findAllByPremiumTrueOrderByStartedAtDesc().stream()
            .map(this::toSubscriptionResponse)
            .toList();
    }

    @Transactional
    public FinancialTransactionResponse processRefund(UUID transactionId) {
        FinancialTransaction tx = findTransaction(transactionId);
        if ("refund".equals(tx.getTransactionType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already a refund transaction");
        }
        if (!"completed".equals(tx.getStatus()) && !"failed".equals(tx.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only completed or failed payments can be refunded");
        }

        tx.setStatus("refunded");
        transactionRepository.save(tx);

        if (tx.getLinkedPaymentId() != null) {
            paymentRepository.findById(tx.getLinkedPaymentId()).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
            });
        }

        FinancialTransaction refund = new FinancialTransaction();
        refund.setTransactionCode(nextCode("TXN", transactionRepository.count() + 1));
        refund.setTransactionType("refund");
        refund.setPayerUserId(tx.getPayeeUserId());
        refund.setPayerDisplayName(tx.getPayeeDisplayName() != null ? tx.getPayeeDisplayName() : "Platform");
        refund.setPayeeUserId(tx.getPayerUserId());
        refund.setPayeeDisplayName(tx.getPayerDisplayName());
        refund.setAmountCents(tx.getAmountCents());
        refund.setCurrency(tx.getCurrency());
        refund.setCommissionCents(0);
        refund.setPlatformRevenueCents(-tx.getPlatformRevenueCents());
        refund.setStatus("completed");
        refund.setLinkedPaymentId(tx.getLinkedPaymentId());
        refund.setDescription("Refund for " + tx.getTransactionCode());

        return toResponse(transactionRepository.save(refund));
    }

    @Transactional
    public FinancialTransactionResponse retryFailedPayment(UUID transactionId) {
        FinancialTransaction tx = findTransaction(transactionId);
        if (!"failed".equals(tx.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only failed transactions can be retried");
        }
        tx.setStatus("completed");
        tx.setPlatformRevenueCents(calculatePlatformRevenue(tx.getAmountCents(), tx.getTransactionType()));
        tx.setCommissionCents(calculateCommission(tx.getAmountCents(), tx.getTransactionType()));
        transactionRepository.save(tx);

        if (tx.getLinkedPaymentId() != null) {
            paymentRepository.findById(tx.getLinkedPaymentId()).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setFailureReason(null);
                payment.setCompletedAt(Instant.now());
                paymentRepository.save(payment);
            });
        }
        return toResponse(tx);
    }

    @Transactional
    public MentorPayoutResponse processPayout(UUID payoutId) {
        MentorPayout payout = payoutRepository.findById(payoutId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payout not found"));
        if (!"pending".equals(payout.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payout is not pending");
        }
        payout.setStatus("completed");
        payout.setCompletedAt(Instant.now());
        return toPayoutResponse(payoutRepository.save(payout));
    }

    private void upsertFromPayment(Payment payment) {
        FinancialTransaction tx = transactionRepository.findByLinkedPaymentId(payment.getId())
            .orElseGet(FinancialTransaction::new);

        if (tx.getId() == null) {
            tx.setTransactionCode(nextCode("TXN", transactionRepository.count() + 1));
            tx.setLinkedPaymentId(payment.getId());
        }

        String type = inferType(payment.getDescription());
        tx.setTransactionType(type);
        tx.setPayerUserId(payment.getUserId());
        tx.setPayerDisplayName("User " + payment.getUserId().toString().substring(0, 8));
        tx.setPayeeUserId(inferPayeeId(type));
        tx.setPayeeDisplayName(inferPayeeName(payment.getDescription(), type));
        long amountCents = toCents(payment.getAmount());
        tx.setAmountCents(amountCents);
        tx.setCurrency(payment.getCurrency());
        tx.setStatus(mapPaymentStatus(payment.getStatus()));
        tx.setCommissionCents(calculateCommission(amountCents, type));
        tx.setPlatformRevenueCents(calculatePlatformRevenue(amountCents, type));
        tx.setDescription(payment.getDescription());
        transactionRepository.save(tx);
    }

    private String inferType(String description) {
        if (description == null) {
            return "payment";
        }
        String lower = description.toLowerCase(Locale.ROOT);
        if (lower.contains("refund")) {
            return "refund";
        }
        if (lower.contains("subscription") || lower.contains("premium") || lower.contains("pro plan")) {
            return "subscription";
        }
        if (lower.contains("payout")) {
            return "payout";
        }
        if (lower.contains("mentor") || lower.contains("session") || lower.contains("booking")) {
            return "payment";
        }
        return "payment";
    }

    private UUID inferPayeeId(String type) {
        if ("subscription".equals(type) || "commission".equals(type)) {
            return null;
        }
        return UUID.fromString("11111111-1111-1111-1111-111111111101");
    }

    private String inferPayeeName(String description, String type) {
        if ("subscription".equals(type)) {
            return "DevConnect Platform";
        }
        if (description != null && description.contains("Rahul")) {
            return "Rahul Sharma — System Design & Backend";
        }
        if (description != null && description.contains("Sarah")) {
            return "Sarah Chen — Frontend & React";
        }
        if (description != null && description.contains("Mike")) {
            return "Mike Johnson — DSA & Interview Prep";
        }
        return "Mentor";
    }

    private long calculateCommission(long amountCents, String type) {
        if ("subscription".equals(type) || "refund".equals(type) || "payout".equals(type)) {
            return 0;
        }
        return (amountCents * COMMISSION_BPS) / 10000;
    }

    private long calculatePlatformRevenue(long amountCents, String type) {
        if ("subscription".equals(type)) {
            return amountCents;
        }
        if ("refund".equals(type) || "payout".equals(type)) {
            return 0;
        }
        return calculateCommission(amountCents, type);
    }

    private String mapPaymentStatus(PaymentStatus status) {
        return switch (status) {
            case COMPLETED -> "completed";
            case FAILED -> "failed";
            case REFUNDED -> "refunded";
            case PENDING, AUTHORIZED -> "pending";
        };
    }

    private long toCents(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
    }

    private List<RevenueTrendPoint> buildRevenueTrend() {
        List<RevenueTrendPoint> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEE", Locale.US);
        Instant now = Instant.now();
        for (int i = 6; i >= 0; i--) {
            Instant day = now.minus(i, ChronoUnit.DAYS);
            Instant dayEnd = day.plus(1, ChronoUnit.DAYS);
            long cents = transactionRepository.sumRevenueBetween(day, dayEnd);
            points.add(new RevenueTrendPoint(fmt.format(day.atZone(ZoneId.systemDefault())), cents));
        }
        return points;
    }

    private FinancialTransaction findTransaction(UUID id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));
    }

    private FinancialTransactionResponse toResponse(FinancialTransaction tx) {
        return new FinancialTransactionResponse(
            tx.getId(),
            tx.getTransactionCode(),
            tx.getTransactionType(),
            typeLabel(tx.getTransactionType()),
            tx.getPayerUserId(),
            tx.getPayerDisplayName() != null ? tx.getPayerDisplayName() : "—",
            tx.getPayeeUserId(),
            tx.getPayeeDisplayName() != null ? tx.getPayeeDisplayName() : "DevConnect Platform",
            tx.getAmountCents(),
            formatMoney(tx.getAmountCents()),
            tx.getCurrency(),
            tx.getCommissionCents(),
            formatMoney(tx.getCommissionCents()),
            tx.getPlatformRevenueCents(),
            formatMoney(tx.getPlatformRevenueCents()),
            tx.getStatus(),
            statusLabel(tx.getStatus()),
            tx.getLinkedPaymentId(),
            tx.getDescription(),
            tx.getCreatedAt(),
            formatDate(tx.getCreatedAt())
        );
    }

    private MentorPayoutResponse toPayoutResponse(MentorPayout p) {
        return new MentorPayoutResponse(
            p.getId(),
            p.getPayoutCode(),
            p.getMentorId(),
            p.getMentorDisplayName(),
            p.getAmountCents(),
            formatMoney(p.getAmountCents()),
            p.getStatus(),
            p.getFailureReason(),
            p.getCreatedAt(),
            p.getCompletedAt()
        );
    }

    private PremiumSubscriptionResponse toSubscriptionResponse(PremiumSubscription s) {
        return new PremiumSubscriptionResponse(
            s.getId(),
            s.getUserId(),
            s.getUsername(),
            s.getPlanId(),
            s.getPlanName(),
            s.getAmountCents(),
            formatMoney(s.getAmountCents()),
            s.getStatus(),
            s.isPremium(),
            s.getStartedAt(),
            s.getRenewsAt()
        );
    }

    private String typeLabel(String type) {
        return switch (type) {
            case "refund" -> "Refund";
            case "payout" -> "Payout";
            case "subscription" -> "Subscription";
            case "commission" -> "Commission";
            default -> "Payment";
        };
    }

    private String statusLabel(String status) {
        if (status == null) {
            return "Unknown";
        }
        return status.substring(0, 1).toUpperCase(Locale.ROOT) + status.substring(1);
    }

    private String formatMoney(long cents) {
        return String.format(Locale.US, "$%.2f", cents / 100.0);
    }

    private String formatDate(Instant instant) {
        return DateTimeFormatter.ofPattern("MMM d", Locale.US)
            .format(instant.atZone(ZoneId.systemDefault()));
    }

    private String nextCode(String prefix, long seq) {
        return prefix + String.format("%05d", seq);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeQuery(String query) {
        return query != null && !query.isBlank() ? query.trim() : null;
    }
}
