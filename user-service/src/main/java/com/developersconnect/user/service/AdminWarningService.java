package com.developersconnect.user.service;

import com.developersconnect.user.dto.CreateUserWarningRequest;
import com.developersconnect.user.dto.UserWarningResponse;
import com.developersconnect.user.dto.WarningAnalyticsResponse;
import com.developersconnect.user.model.PlatformUserWarning;
import com.developersconnect.user.repository.PlatformUserWarningRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminWarningService {

    private static final String DEFAULT_MESSAGE = "Your account violated community guidelines.";
    private static final Set<String> SEVERITIES = Set.of("low", "medium", "high");

    private final PlatformUserWarningRepository warningRepository;

    public AdminWarningService(PlatformUserWarningRepository warningRepository) {
        this.warningRepository = warningRepository;
    }

    @Transactional(readOnly = true)
    public List<UserWarningResponse> listWarnings(String status) {
        List<PlatformUserWarning> warnings = warningRepository.findAllByOrderByCreatedAtDesc();
        if ("unacknowledged".equalsIgnoreCase(status)) {
            return warnings.stream().filter(w -> !w.isAcknowledged()).map(this::toResponse).toList();
        }
        if ("acknowledged".equalsIgnoreCase(status)) {
            return warnings.stream().filter(PlatformUserWarning::isAcknowledged).map(this::toResponse).toList();
        }
        return warnings.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WarningAnalyticsResponse getAnalytics() {
        List<PlatformUserWarning> all = warningRepository.findAll();
        long high = all.stream().filter(w -> "high".equals(w.getSeverity())).count();
        return new WarningAnalyticsResponse(
            all.size(),
            warningRepository.countByAcknowledgedFalse(),
            high
        );
    }

    @Transactional
    public UserWarningResponse createWarning(UUID adminId, String adminUsername, CreateUserWarningRequest request) {
        PlatformUserWarning warning = new PlatformUserWarning();
        warning.setAccountId(request.accountId());
        warning.setUsername(request.username().trim());
        warning.setMessage(
            request.message() != null && !request.message().isBlank()
                ? request.message().trim()
                : DEFAULT_MESSAGE
        );
        warning.setReason(request.reason().trim());
        warning.setSeverity(normalizeSeverity(request.severity()));
        warning.setIssuedById(adminId);
        warning.setIssuedByUsername(adminUsername);
        warning.setSourceReportId(request.sourceReportId());
        warning.setAcknowledged(false);
        return toResponse(warningRepository.save(warning));
    }

    @Transactional
    public UserWarningResponse createWarningFromReport(
        UUID accountId,
        String username,
        String reason,
        UUID sourceReportId,
        UUID adminId,
        String adminUsername
    ) {
        return createWarning(
            adminId,
            adminUsername,
            new CreateUserWarningRequest(
                accountId,
                username,
                DEFAULT_MESSAGE,
                reason != null && !reason.isBlank() ? reason : "Reported violation",
                "medium",
                sourceReportId
            )
        );
    }

    @Transactional
    public UserWarningResponse acknowledgeWarning(UUID warningId) {
        PlatformUserWarning warning = findWarning(warningId);
        warning.setAcknowledged(true);
        warning.setAcknowledgedAt(Instant.now());
        return toResponse(warningRepository.save(warning));
    }

    @Transactional
    public void deleteWarning(UUID warningId) {
        if (!warningRepository.existsById(warningId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Warning not found");
        }
        warningRepository.deleteById(warningId);
    }

    private PlatformUserWarning findWarning(UUID warningId) {
        return warningRepository.findById(warningId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warning not found"));
    }

    private UserWarningResponse toResponse(PlatformUserWarning warning) {
        return new UserWarningResponse(
            warning.getId(),
            warning.getAccountId(),
            warning.getUsername(),
            warning.getMessage(),
            warning.getReason(),
            warning.getSeverity(),
            severityLabel(warning.getSeverity()),
            warning.getIssuedByUsername(),
            warning.getSourceReportId(),
            warning.isAcknowledged(),
            warning.getAcknowledgedAt(),
            warning.getCreatedAt()
        );
    }

    private String severityLabel(String severity) {
        return switch (severity) {
            case "high" -> "High";
            case "low" -> "Low";
            default -> "Medium";
        };
    }

    private String normalizeSeverity(String severity) {
        String normalized = severity.trim().toLowerCase(Locale.ROOT);
        if (!SEVERITIES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid severity");
        }
        return normalized;
    }
}
