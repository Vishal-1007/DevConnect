package com.developersconnect.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecruiterSubscriptionScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecruiterSubscriptionScheduler.class);

    private final RecruiterSubscriptionService subscriptionService;

    public RecruiterSubscriptionScheduler(RecruiterSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void processExpiredSubscriptions() {
        int count = subscriptionService.processExpiredSubscriptions();
        if (count > 0) {
            log.info("Downgraded {} expired recruiter subscriptions to FREE", count);
        }
    }

    @Scheduled(cron = "0 5 0 1 * *")
    public void resetMonthlyUsage() {
        int count = subscriptionService.resetMonthlyUsageForAll();
        log.info("Reset monthly recruiter usage for {} subscriptions", count);
    }
}
