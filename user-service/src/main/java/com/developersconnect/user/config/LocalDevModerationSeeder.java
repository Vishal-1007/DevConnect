package com.developersconnect.user.config;

import com.developersconnect.user.model.PlatformUserBan;
import com.developersconnect.user.model.PlatformUserWarning;
import com.developersconnect.user.repository.PlatformUserBanRepository;
import com.developersconnect.user.repository.PlatformUserWarningRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(26)
public class LocalDevModerationSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevModerationSeeder.class);

    private final PlatformUserBanRepository banRepository;
    private final PlatformUserWarningRepository warningRepository;

    public LocalDevModerationSeeder(
        PlatformUserBanRepository banRepository,
        PlatformUserWarningRepository warningRepository
    ) {
        this.banRepository = banRepository;
        this.warningRepository = warningRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (banRepository.count() == 0) {
            PlatformUserBan ban = new PlatformUserBan();
            ban.setAccountId(LocalDevDemoProfiles.RAHUL_ID);
            ban.setUsername("rahul.demo");
            ban.setBanType("temporary");
            ban.setReason("Repeated harassment in mentorship chat");
            ban.setBannedById(LocalDevDemoProfiles.SARAH_ID);
            ban.setBannedByUsername("admin");
            ban.setBannedAt(Instant.now().minus(2, ChronoUnit.DAYS));
            ban.setExpiresAt(Instant.now().plus(5, ChronoUnit.DAYS));
            ban.setActive(true);
            banRepository.save(ban);
            log.info("Seeded demo user ban");
        }

        if (warningRepository.count() == 0) {
            seedWarning(
                LocalDevDemoProfiles.MIKE_ID,
                "mike.demo",
                "Your account violated community guidelines.",
                "Promotional spam in community feed",
                "medium"
            );
            seedWarning(
                LocalDevDemoProfiles.SARAH_ID,
                "sarah.demo",
                "Your account violated community guidelines.",
                "Borderline abusive language in discussion thread",
                "high"
            );
            log.info("Seeded {} demo warnings", warningRepository.count());
        }
    }

    private void seedWarning(
        java.util.UUID accountId,
        String username,
        String message,
        String reason,
        String severity
    ) {
        PlatformUserWarning warning = new PlatformUserWarning();
        warning.setAccountId(accountId);
        warning.setUsername(username);
        warning.setMessage(message);
        warning.setReason(reason);
        warning.setSeverity(severity);
        warning.setIssuedById(LocalDevDemoProfiles.SARAH_ID);
        warning.setIssuedByUsername("admin");
        warning.setAcknowledged(false);
        warningRepository.save(warning);
    }
}
