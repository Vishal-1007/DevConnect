package com.developersconnect.mentor.config;

import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
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
@Order(6)
public class LocalDevMentorApplicationSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevMentorApplicationSeeder.class);

    private static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final MentorApplicationRepository mentorApplicationRepository;

    public LocalDevMentorApplicationSeeder(MentorApplicationRepository mentorApplicationRepository) {
        this.mentorApplicationRepository = mentorApplicationRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(RAHUL_ID, "rahul.demo", "Rahul Sharma — System Design & Backend", 4500);
        seed(SARAH_ID, "sarah.demo", "Sarah Chen — Frontend & React", 5000);
        seed(MIKE_ID, "mike.demo", "Mike Johnson — DSA & Interview Prep", 4000);
        log.info("Seeded {} approved local demo mentor applications", mentorApplicationRepository.count());
    }

    private void seed(UUID userId, String username, String headline, int hourlyRateCents) {
        if (mentorApplicationRepository.findByUserId(userId).isPresent()) {
            return;
        }
        MentorApplication application = new MentorApplication();
        application.setUserId(userId);
        application.setUsername(username);
        application.setHeadline(headline);
        application.setHourlyRateCents(hourlyRateCents);
        application.setMotivation("Seeded demo mentor application.");
        application.setStatus(MentorApplication.Status.APPROVED);
        application.setReviewedBy("system");
        mentorApplicationRepository.save(application);
    }
}
