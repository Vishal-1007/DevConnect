package com.developersconnect.user.service;

import com.developersconnect.user.dto.SystemLogAnalyticsResponse;
import com.developersconnect.user.dto.SystemLogResponse;
import com.developersconnect.user.model.PlatformSystemLog;
import com.developersconnect.user.repository.PlatformSystemLogRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SystemLogService {

    private static final Set<String> LEVELS = Set.of("info", "warn", "error", "debug");
    private static final Set<String> CATEGORIES = Set.of(
        "login_attempt", "api_error", "crash", "payment_failure", "server_issue", "security_audit", "general"
    );

    private final PlatformSystemLogRepository logRepository;

    public SystemLogService(PlatformSystemLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemLogResponse> listLogs(String level, String category, String service, String query, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 500);
        return logRepository.search(
            normalizeLevel(level),
            normalizeCategory(category),
            normalizeService(service),
            normalizeQuery(query),
            PageRequest.of(0, safeLimit)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SystemLogAnalyticsResponse getAnalytics() {
        return new SystemLogAnalyticsResponse(
            logRepository.count(),
            logRepository.countByLevel("info"),
            logRepository.countByLevel("warn"),
            logRepository.countByLevel("error"),
            logRepository.countByLevel("debug"),
            logRepository.countByCategory("login_attempt"),
            logRepository.countByCategory("api_error"),
            logRepository.countByCategory("payment_failure"),
            logRepository.countByCategory("server_issue")
        );
    }

    @Transactional
    public SystemLogResponse record(
        String level,
        String service,
        String category,
        String message,
        String details
    ) {
        PlatformSystemLog entry = new PlatformSystemLog();
        entry.setLevel(normalizeLevelRequired(level));
        entry.setService(normalizeServiceRequired(service));
        entry.setCategory(normalizeCategoryRequired(category));
        entry.setMessage(message.trim());
        entry.setDetails(details != null && !details.isBlank() ? details.trim() : null);
        entry.setCreatedAt(Instant.now());
        return toResponse(logRepository.save(entry));
    }

    @Transactional
    public void recordLoginAttempt(String username, boolean success, String sourceIp) {
        record(
            success ? "info" : "warn",
            "auth-service",
            "login_attempt",
            success
                ? "User '" + username + "' authenticated successfully"
                : "Failed login attempt for user '" + username + "'",
            sourceIp != null ? "sourceIp=" + sourceIp : null
        );
    }

    @Transactional
    public void recordApiError(String service, String endpoint, String errorMessage) {
        record("error", service, "api_error", "API error on " + endpoint + ": " + errorMessage, null);
    }

    @Transactional
    public void recordPaymentFailure(String reference, String reason) {
        record(
            "error",
            "payment-service",
            "payment_failure",
            "Payment failed for reference " + reference,
            reason
        );
    }

    @Transactional
    public void recordServerIssue(String service, String message, String details) {
        record("warn", service, "server_issue", message, details);
    }

    private SystemLogResponse toResponse(PlatformSystemLog log) {
        return new SystemLogResponse(
            log.getId(),
            log.getLevel(),
            levelLabel(log.getLevel()),
            log.getService(),
            log.getCategory(),
            categoryLabel(log.getCategory()),
            log.getMessage(),
            log.getDetails(),
            log.getCreatedAt(),
            formatTime(log.getCreatedAt())
        );
    }

    private String levelLabel(String level) {
        return switch (level) {
            case "warn" -> "WARN";
            case "error" -> "ERROR";
            case "debug" -> "DEBUG";
            default -> "INFO";
        };
    }

    private String categoryLabel(String category) {
        return switch (category) {
            case "login_attempt" -> "Login";
            case "api_error" -> "API Error";
            case "crash" -> "Crash";
            case "payment_failure" -> "Payment";
            case "server_issue" -> "Server";
            case "security_audit" -> "Security";
            default -> "General";
        };
    }

    private String formatTime(Instant instant) {
        return DateTimeFormatter.ofPattern("h:mm:ss a", Locale.US)
            .format(instant.atZone(ZoneId.systemDefault()));
    }

    private String normalizeLevel(String level) {
        if (level == null || level.isBlank() || "all".equalsIgnoreCase(level)) {
            return null;
        }
        String normalized = level.trim().toLowerCase(Locale.ROOT);
        return LEVELS.contains(normalized) ? normalized : null;
    }

    private String normalizeLevelRequired(String level) {
        String normalized = normalizeLevel(level);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid log level");
        }
        return normalized;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return null;
        }
        String normalized = category.trim().toLowerCase(Locale.ROOT);
        return CATEGORIES.contains(normalized) ? normalized : null;
    }

    private String normalizeCategoryRequired(String category) {
        String normalized = normalizeCategory(category);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid log category");
        }
        return normalized;
    }

    private String normalizeService(String service) {
        if (service == null || service.isBlank() || "all".equalsIgnoreCase(service)) {
            return null;
        }
        return service.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeServiceRequired(String service) {
        String normalized = normalizeService(service);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid service name");
        }
        return normalized;
    }

    private String normalizeQuery(String query) {
        return query != null && !query.isBlank() ? query.trim() : null;
    }
}
