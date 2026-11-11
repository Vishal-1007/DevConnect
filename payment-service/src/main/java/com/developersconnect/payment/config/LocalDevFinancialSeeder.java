package com.developersconnect.payment.config;

import com.developersconnect.payment.model.FinancialTransaction;
import com.developersconnect.payment.model.MentorPayout;
import com.developersconnect.payment.model.PremiumSubscription;
import com.developersconnect.payment.repository.FinancialTransactionRepository;
import com.developersconnect.payment.repository.MentorPayoutRepository;
import com.developersconnect.payment.repository.PremiumSubscriptionRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(10)
public class LocalDevFinancialSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevFinancialSeeder.class);

    private static final UUID RAHUL = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final FinancialTransactionRepository transactionRepository;
    private final MentorPayoutRepository payoutRepository;
    private final PremiumSubscriptionRepository subscriptionRepository;

    public LocalDevFinancialSeeder(
        FinancialTransactionRepository transactionRepository,
        MentorPayoutRepository payoutRepository,
        PremiumSubscriptionRepository subscriptionRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.payoutRepository = payoutRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (transactionRepository.count() > 0) {
            return;
        }

        Instant base = Instant.now().truncatedTo(ChronoUnit.DAYS);

        seedTx("TXN00001", "payment", "admin", RAHUL, "Rahul Sharma — System Design & Backend",
            2250, 675, 675, "completed", base);
        seedTx("TXN00002", "payment", "vishu01", SARAH, "Sarah Chen — Frontend & React",
            3750, 1125, 1125, "completed", base.minus(1, ChronoUnit.DAYS));
        seedTx("TXN00003", "subscription", "admin", null, "DevConnect Platform",
            1999, 0, 1999, "completed", base.minus(2, ChronoUnit.DAYS));
        seedTx("TXN00004", "payment", "learner1", MIKE, "Mike Johnson — DSA & Interview Prep",
            4000, 1200, 1200, "completed", base.minus(3, ChronoUnit.DAYS));
        seedTx("TXN00005", "refund", "DevConnect Platform", null, "vishu01",
            2250, 0, -675, "completed", base.minus(4, ChronoUnit.DAYS));
        seedTx("TXN00006", "payment", "vishu01", RAHUL, "Rahul Sharma — System Design & Backend",
            2250, 675, 675, "failed", base.minus(5, ChronoUnit.DAYS));

        seedPayout("PO0001", RAHUL, "Rahul Sharma — System Design & Backend", 1575, "pending");
        seedPayout("PO0002", SARAH, "Sarah Chen — Frontend & React", 2625, "pending");
        seedPayout("PO0003", MIKE, "Mike Johnson — DSA & Interview Prep", 2800, "completed");

        seedSub("admin", "pro_monthly", "Pro Monthly", 1999);
        seedSub("vishu01", "pro_annual", "Pro Annual", 14999);

        log.info("Seeded financial admin demo data");
    }

    private void seedTx(
        String code,
        String type,
        String payer,
        UUID payeeId,
        String payeeName,
        long amount,
        long commission,
        long platform,
        String status,
        Instant created
    ) {
        FinancialTransaction tx = new FinancialTransaction();
        tx.setTransactionCode(code);
        tx.setTransactionType(type);
        tx.setPayerUserId(UUID.nameUUIDFromBytes(("payer-" + payer).getBytes()));
        tx.setPayerDisplayName(payer);
        tx.setPayeeUserId(payeeId);
        tx.setPayeeDisplayName(payeeName);
        tx.setAmountCents(amount);
        tx.setCommissionCents(commission);
        tx.setPlatformRevenueCents(platform);
        tx.setStatus(status);
        tx.setDescription(type + " — " + payeeName);
        transactionRepository.save(tx);
    }

    private void seedPayout(String code, UUID mentorId, String name, long amount, String status) {
        MentorPayout p = new MentorPayout();
        p.setPayoutCode(code);
        p.setMentorId(mentorId);
        p.setMentorDisplayName(name);
        p.setAmountCents(amount);
        p.setStatus(status);
        if ("completed".equals(status)) {
            p.setCompletedAt(Instant.now());
        }
        payoutRepository.save(p);
    }

    private void seedSub(String username, String planId, String planName, long amount) {
        PremiumSubscription s = new PremiumSubscription();
        s.setUserId(UUID.nameUUIDFromBytes(("sub-" + username).getBytes()));
        s.setUsername(username);
        s.setPlanId(planId);
        s.setPlanName(planName);
        s.setAmountCents(amount);
        s.setStatus("active");
        s.setPremium(true);
        s.setRenewsAt(Instant.now().plus(30, ChronoUnit.DAYS));
        subscriptionRepository.save(s);
    }
}
