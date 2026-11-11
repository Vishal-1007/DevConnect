package com.developersconnect.mentor.config;

import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(20)
public class MockInterviewApprovedMentorBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MockInterviewApprovedMentorBackfillRunner.class);

    private final MentorProfileRepository profileRepository;
    private final MentorApplicationRepository applicationRepository;

    public MockInterviewApprovedMentorBackfillRunner(
        MentorProfileRepository profileRepository,
        MentorApplicationRepository applicationRepository
    ) {
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        int backfilled = 0;
        for (MentorProfile profile : profileRepository.findAll()) {
            if (!profile.isVerified()) {
                continue;
            }
            String adminStatus = profile.getAdminStatus();
            if (adminStatus != null
                && ("BLOCKED".equalsIgnoreCase(adminStatus) || "SUSPENDED".equalsIgnoreCase(adminStatus))) {
                continue;
            }

            MentorApplication application = applicationRepository.findByUserId(profile.getUserId()).orElse(null);
            if (application != null && application.getStatus() == MentorApplication.Status.APPROVED) {
                continue;
            }

            MentorApplication app = application != null ? application : new MentorApplication();
            if (app.getUserId() == null) {
                app.setUserId(profile.getUserId());
            }
            app.setUsername(profile.getFullName());
            app.setHeadline(profile.getHeadline());
            app.setBio(profile.getBio());
            app.setHourlyRateCents(profile.getHourlyRateCents());
            app.setStatus(MentorApplication.Status.APPROVED);
            applicationRepository.save(app);
            backfilled++;
        }

        if (backfilled > 0) {
            log.info("Backfilled {} APPROVED mentor applications for mock interview marketplace", backfilled);
        }
    }
}
