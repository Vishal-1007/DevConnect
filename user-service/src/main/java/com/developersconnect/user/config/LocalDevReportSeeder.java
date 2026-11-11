package com.developersconnect.user.config;

import com.developersconnect.user.model.PlatformReport;
import com.developersconnect.user.repository.PlatformReportRepository;
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
@Order(25)
public class LocalDevReportSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevReportSeeder.class);

    private final PlatformReportRepository reportRepository;

    public LocalDevReportSeeder(PlatformReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (reportRepository.count() > 0) {
            return;
        }

        Instant base = Instant.now();
        UUID rahul = UUID.fromString("11111111-1111-1111-1111-111111111101");
        UUID sarah = UUID.fromString("11111111-1111-1111-1111-111111111102");

        seed("RPT0001", "harassment", "user", "@toxic_dev", rahul, "vishu01",
            "Repeated hostile messages in mentorship chat", "pending", base);
        seed("RPT0002", "spam", "post", "Buy crypto now!!!", null, "admin",
            "Promotional spam in community feed", "pending", base.minus(1, ChronoUnit.DAYS));
        seed("RPT0003", "fake_profile", "user", "@fake_senior_eng", sarah, "learner1",
            "Profile claims FAANG experience with inconsistent details", "under_review", base.minus(2, ChronoUnit.DAYS));
        seed("RPT0004", "abusive_language", "message", "DM thread #4421", rahul, "admin",
            "Slurs used in private message", "pending", base.minus(3, ChronoUnit.DAYS));
        seed("RPT0005", "scam_attempt", "user", "@pay_me_first", null, "vishu01",
            "Asked for payment outside platform before session", "escalated", base.minus(4, ChronoUnit.DAYS));
        seed("RPT0006", "harassment", "room", "Late night study room", null, "learner2",
            "Harassment during live room session", "resolved", base.minus(5, ChronoUnit.DAYS));
        seed("RPT0007", "spam", "post", "Join my telegram channel", null, "vishu01",
            "Off-platform spam link", "pending", base.minus(1, ChronoUnit.DAYS));
        seed("RPT0008", "abusive_language", "post", "Offensive rant about juniors…", null, "admin",
            "Abusive language toward new developers", "under_review", base);

        log.info("Seeded {} platform abuse reports", reportRepository.count());
    }

    private void seed(
        String code,
        String category,
        String targetType,
        String summary,
        UUID targetAccountId,
        String reporter,
        String details,
        String status,
        Instant created
    ) {
        PlatformReport report = new PlatformReport();
        report.setReportCode(code);
        report.setCategory(category);
        report.setTargetType(targetType);
        report.setTargetSummary(summary);
        report.setTargetAccountId(targetAccountId);
        report.setTargetId(null);
        report.setReporterId(UUID.nameUUIDFromBytes(("reporter-" + reporter).getBytes()));
        report.setReporterUsername(reporter);
        report.setDetails(details);
        report.setStatus(status);
        if ("resolved".equals(status)) {
            report.setAdminAction("warning");
            report.setResolvedAt(created.plus(1, ChronoUnit.DAYS));
            report.setReviewedByUsername("admin");
        }
        reportRepository.save(report);
    }
}
