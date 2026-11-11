package com.developersconnect.user.config;

import com.developersconnect.user.model.PlatformSystemLog;
import com.developersconnect.user.repository.PlatformSystemLogRepository;
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
@Order(27)
public class LocalDevSystemLogSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevSystemLogSeeder.class);

    private final PlatformSystemLogRepository logRepository;

    public LocalDevSystemLogSeeder(PlatformSystemLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (logRepository.count() > 0) {
            return;
        }

        Instant now = Instant.now();

        seed("info", "auth-service", "login_attempt", "User 'admin' authenticated successfully",
            "sourceIp=127.0.0.1", now.minus(3, ChronoUnit.MINUTES));
        seed("info", "auth-service", "login_attempt", "User 'vishu01' authenticated successfully",
            "sourceIp=192.168.1.42", now.minus(7, ChronoUnit.MINUTES));
        seed("warn", "auth-service", "login_attempt", "Failed login attempt for user 'admin'",
            "sourceIp=203.0.113.8 · invalid password", now.minus(12, ChronoUnit.MINUTES));
        seed("warn", "auth-service", "security_audit", "Multiple failed login attempts from IP 203.0.113.8",
            "5 attempts in 10 minutes", now.minus(11, ChronoUnit.MINUTES));

        seed("info", "user-service", "general", "Video room 'Startup Networking' created by Mike Johnson",
            null, now.minus(5, ChronoUnit.MINUTES));
        seed("info", "gateway", "general", "Rate limiter reset for all IPs", null, now.minus(2, ChronoUnit.MINUTES));
        seed("info", "gateway", "general", "Health check passed for all downstream services", null, now.minus(35, ChronoUnit.MINUTES));

        seed("warn", "notification-service", "server_issue", "Email queue backlog: 12 pending messages",
            "queue=email-outbound", now.minus(5, ChronoUnit.MINUTES));
        seed("warn", "user-service", "server_issue", "High memory usage detected: 82% heap utilisation",
            "heapUsed=512MB heapMax=624MB", now.minus(30, ChronoUnit.MINUTES));

        seed("error", "mentor-service", "api_error", "Failed to send mentor approval notification: timeout",
            "POST /api/notifications/send · timeout after 30s", now.minus(15, ChronoUnit.MINUTES));
        seed("error", "notification-service", "api_error", "SMTP connection refused — retrying in 30s",
            "host=smtp.devconnect.local port=587", now.minus(50, ChronoUnit.MINUTES));
        seed("error", "payment-service", "payment_failure", "Payment failed for reference PAY-2026-00482",
            "Stripe error: card_declined · insufficient_funds", now.minus(18, ChronoUnit.MINUTES));
        seed("error", "payment-service", "payment_failure", "Payment webhook signature verification failed",
            "reference=PAY-2026-00479", now.minus(45, ChronoUnit.MINUTES));

        seed("error", "user-service", "crash", "Unhandled exception in CommunityFeedController.createPost",
            "NullPointerException at CommunityFeedService.java:104", now.minus(90, ChronoUnit.MINUTES));
        seed("error", "gateway", "crash", "Downstream service unavailable: matching-service",
            "503 Service Unavailable · circuit breaker open", now.minus(120, ChronoUnit.MINUTES));

        seed("info", "auth-service", "security_audit", "JWT secret rotation completed", null, now.minus(22, ChronoUnit.MINUTES));
        seed("info", "auth-service", "general", "Refresh token cleanup job completed — 3 expired tokens removed",
            null, now.minus(58, ChronoUnit.MINUTES));
        seed("info", "matching-service", "general", "Match index updated for 24 users", null, now.minus(8, ChronoUnit.MINUTES));
        seed("debug", "matching-service", "general", "Vector similarity computation completed in 143ms",
            "candidates=48", now.minus(42, ChronoUnit.MINUTES));

        log.info("Seeded {} platform system logs", logRepository.count());
    }

    private void seed(
        String level,
        String service,
        String category,
        String message,
        String details,
        Instant createdAt
    ) {
        PlatformSystemLog entry = new PlatformSystemLog();
        entry.setLevel(level);
        entry.setService(service);
        entry.setCategory(category);
        entry.setMessage(message);
        entry.setDetails(details);
        entry.setCreatedAt(createdAt);
        logRepository.save(entry);
    }
}
