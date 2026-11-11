package com.developersconnect.mentor.config;

import com.developersconnect.mentor.service.MentorshipRequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(20)
public class MentorshipRelationshipBackfillRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MentorshipRelationshipBackfillRunner.class);

    private final MentorshipRequestService mentorshipRequestService;

    public MentorshipRelationshipBackfillRunner(MentorshipRequestService mentorshipRequestService) {
        this.mentorshipRequestService = mentorshipRequestService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int synced = mentorshipRequestService.backfillAcceptedRelationshipsFromRequests();
        if (synced > 0) {
            log.info("Backfilled {} mentor-student relationship(s) from ACCEPTED mentorship requests", synced);
        }
    }
}
