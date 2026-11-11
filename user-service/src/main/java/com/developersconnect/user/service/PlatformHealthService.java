package com.developersconnect.user.service;

import com.developersconnect.user.dto.PlatformHealthItemResponse;
import com.developersconnect.user.dto.PlatformHealthResponse;
import com.developersconnect.user.repository.PlatformSystemLogRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
public class PlatformHealthService {

    private final DataSource dataSource;
    private final AdminFeatureService featureService;
    private final PlatformSystemLogRepository logRepository;
    private final RestTemplate restTemplate;

    @Value("${app.health.gateway-uri:http://localhost:8080}")
    private String gatewayUri;

    @Value("${app.health.auth-uri:http://localhost:8081}")
    private String authUri;

    @Value("${app.health.payment-uri:http://localhost:8089}")
    private String paymentUri;

    public PlatformHealthService(
        DataSource dataSource,
        AdminFeatureService featureService,
        PlatformSystemLogRepository logRepository,
        RestTemplateBuilder restTemplateBuilder
    ) {
        this.dataSource = dataSource;
        this.featureService = featureService;
        this.logRepository = logRepository;
        this.restTemplate = restTemplateBuilder
            .setConnectTimeout(java.time.Duration.ofSeconds(2))
            .setReadTimeout(java.time.Duration.ofSeconds(2))
            .build();
    }

    @Transactional(readOnly = true)
    public PlatformHealthResponse getHealth() {
        var services = java.util.List.of(
            checkApiServer(),
            checkDatabase(),
            checkWebRtc(),
            checkPaymentGateway(),
            checkAuthService(),
            checkNotificationService()
        );

        long unhealthy = services.stream().filter(s -> !s.healthy()).count();
        String overallStatus = unhealthy == 0 ? "operational" : unhealthy <= 2 ? "degraded" : "down";
        String overallLabel = switch (overallStatus) {
            case "operational" -> "All Systems Operational";
            case "degraded" -> "Partial Outage";
            default -> "Major Outage";
        };

        return new PlatformHealthResponse(overallStatus, overallLabel, services);
    }

    private PlatformHealthItemResponse checkApiServer() {
        boolean ok = probeHealth(gatewayUri + "/actuator/health");
        return new PlatformHealthItemResponse(
            "API Server",
            ok ? "running" : "down",
            ok ? "Gateway responding" : "Gateway unreachable",
            ok
        );
    }

    private PlatformHealthItemResponse checkDatabase() {
        try (var conn = dataSource.getConnection();
             var stmt = conn.createStatement()) {
            stmt.execute("SELECT 1");
            return new PlatformHealthItemResponse("Database", "healthy", "Connection pool OK", true);
        } catch (Exception ex) {
            return new PlatformHealthItemResponse("Database", "down", ex.getMessage(), false);
        }
    }

    private PlatformHealthItemResponse checkWebRtc() {
        if (!featureService.isEnabled("videoRooms")) {
            return new PlatformHealthItemResponse("WebRTC", "disabled", "Video rooms feature is off", false);
        }
        long recentErrors = logRepository.countByCategory("crash");
        boolean ok = recentErrors == 0;
        return new PlatformHealthItemResponse(
            "WebRTC",
            ok ? "active" : "degraded",
            ok ? "Video rooms operational" : recentErrors + " crash events logged",
            ok
        );
    }

    private PlatformHealthItemResponse checkPaymentGateway() {
        if (!featureService.isEnabled("payments")) {
            return new PlatformHealthItemResponse("Payment Gateway", "disabled", "Payments feature is off", false);
        }
        long recentFailures = logRepository.search(
            "error",
            "payment_failure",
            null,
            null,
            org.springframework.data.domain.PageRequest.of(0, 50)
        ).stream()
            .filter(l -> l.getCreatedAt().isAfter(Instant.now().minus(24, ChronoUnit.HOURS)))
            .count();

        boolean serviceUp = probeHealth(paymentUri + "/actuator/health");
        boolean ok = serviceUp && recentFailures == 0;
        String detail = !serviceUp
            ? "Payment service unreachable"
            : recentFailures > 0
                ? recentFailures + " payment failures (24h)"
                : "Stripe integration healthy";
        return new PlatformHealthItemResponse("Payment Gateway", ok ? "healthy" : "down", detail, ok);
    }

    private PlatformHealthItemResponse checkAuthService() {
        boolean ok = probeHealth(authUri + "/actuator/health");
        return new PlatformHealthItemResponse(
            "Auth Service",
            ok ? "running" : "down",
            ok ? "JWT issuer online" : "Auth service unreachable",
            ok
        );
    }

    private PlatformHealthItemResponse checkNotificationService() {
        if (!featureService.isEnabled("notifications")) {
            return new PlatformHealthItemResponse("Notifications", "disabled", "Notifications feature is off", false);
        }
        long backlog = logRepository.search(
            "warn",
            "server_issue",
            "notification-service",
            "queue",
            org.springframework.data.domain.PageRequest.of(0, 10)
        ).size();
        boolean ok = backlog == 0;
        return new PlatformHealthItemResponse(
            "Notifications",
            ok ? "running" : "degraded",
            ok ? "Email queue clear" : "Email queue backlog detected",
            ok
        );
    }

    private boolean probeHealth(String url) {
        try {
            var response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            return false;
        }
    }
}
