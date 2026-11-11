package com.developersconnect.mentor.config;

import com.developersconnect.mentor.service.MockInterviewService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(21)
public class MockInterviewerSyncRunner implements ApplicationRunner {

    private final MockInterviewService mockInterviewService;

    public MockInterviewerSyncRunner(MockInterviewService mockInterviewService) {
        this.mockInterviewService = mockInterviewService;
    }

    @Override
    public void run(ApplicationArguments args) {
        mockInterviewService.syncInterviewersFromProfiles();
    }
}
