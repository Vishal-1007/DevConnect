package com.developersconnect.user.config;

import com.developersconnect.user.model.PlatformNotificationCampaign;
import com.developersconnect.user.repository.PlatformNotificationCampaignRepository;
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
@Order(28)
public class LocalDevNotificationCampaignSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevNotificationCampaignSeeder.class);

    private final PlatformNotificationCampaignRepository campaignRepository;

    public LocalDevNotificationCampaignSeeder(PlatformNotificationCampaignRepository campaignRepository) {
        this.campaignRepository = campaignRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (campaignRepository.count() > 0) {
            return;
        }

        Instant now = Instant.now();

        seed(
            "Platform Update v2.0",
            "New features are live! Check out improved matching and mentor discovery.",
            "ALL_USERS",
            "ANNOUNCEMENT",
            "SENT",
            now.minus(1, ChronoUnit.DAYS),
            4,
            "admin"
        );
        seed(
            "Mentor Applications Open",
            "Apply to become a mentor and help others grow their skills.",
            "LEARNERS",
            "MENTOR_NOTIFICATION",
            "SENT",
            now.minus(2, ChronoUnit.DAYS),
            2,
            "admin"
        );
        seed(
            "Weekly Digest",
            "Your weekly summary of activity, new mentors and upcoming events.",
            "ALL_USERS",
            "ANNOUNCEMENT",
            "SCHEDULED",
            now.plus(1, ChronoUnit.DAYS),
            4,
            "admin"
        );

        log.info("Seeded {} notification campaigns", campaignRepository.count());
    }

    private void seed(
        String title,
        String body,
        String audience,
        String type,
        String status,
        Instant when,
        int recipients,
        String createdBy
    ) {
        PlatformNotificationCampaign campaign = new PlatformNotificationCampaign();
        campaign.setTitle(title);
        campaign.setBody(body);
        campaign.setAudience(audience);
        campaign.setNotificationType(type);
        campaign.setStatus(status);
        campaign.setRecipientCount(recipients);
        campaign.setCreatedByUsername(createdBy);
        campaign.setCreatedAt(when.minus(1, ChronoUnit.HOURS));
        if ("SENT".equals(status)) {
            campaign.setSentAt(when);
        } else {
            campaign.setScheduledAt(when);
        }
        campaignRepository.save(campaign);
    }
}
