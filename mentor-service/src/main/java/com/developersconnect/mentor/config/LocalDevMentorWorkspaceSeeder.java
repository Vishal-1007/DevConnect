package com.developersconnect.mentor.config;

import com.developersconnect.mentor.service.MentorWorkspaceSampleDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Optional local-dev seeder for demo workspace data. Disabled by default;
 * set {@code mentor.workspace.sample-data-enabled=true} to enable.
 */
@Component
@Profile("local")
@Order(11)
@ConditionalOnProperty(name = "mentor.workspace.sample-data-enabled", havingValue = "true")
public class LocalDevMentorWorkspaceSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevMentorWorkspaceSeeder.class);

    private final MentorWorkspaceSampleDataService sampleDataService;

    public LocalDevMentorWorkspaceSeeder(MentorWorkspaceSampleDataService sampleDataService) {
        this.sampleDataService = sampleDataService;
    }

    @Override
    public void run(ApplicationArguments args) {
        sampleDataService.seedAllMentorsWithoutBookings();
        log.info("Local dev mentor workspace seed pass complete");
    }
}
