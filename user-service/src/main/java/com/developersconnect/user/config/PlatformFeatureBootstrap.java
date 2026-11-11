package com.developersconnect.user.config;

import com.developersconnect.user.service.AdminFeatureService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(5)
public class PlatformFeatureBootstrap implements ApplicationRunner {

    private final AdminFeatureService adminFeatureService;

    public PlatformFeatureBootstrap(AdminFeatureService adminFeatureService) {
        this.adminFeatureService = adminFeatureService;
    }

    @Override
    public void run(ApplicationArguments args) {
        adminFeatureService.ensureDefaults();
    }
}
