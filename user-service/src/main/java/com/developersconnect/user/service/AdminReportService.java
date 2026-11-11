package com.developersconnect.user.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.dto.ApplyReportActionRequest;
import com.developersconnect.user.dto.PlatformReportResponse;
import com.developersconnect.user.dto.ReportAnalyticsResponse;
import com.developersconnect.user.model.CommunityPost;
import com.developersconnect.user.model.PlatformReport;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.PlatformReportRepository;
import com.developersconnect.user.repository.UserProfileRepository;

@Service
public class AdminReportService {

    private static final Set<String> CATEGORIES = Set.of(
        "harassment", "spam", "fake_profile", "abusive_language", "scam_attempt"
    );

    private static final Set<String> ACTIONS = Set.of(
        "warning", "temp_ban", "permanent_ban", "content_removal"
    );

    private static final Set<String> STATUSES = Set.of(
        "pending", "under_review", "resolved", "escalated"
    );

    private final PlatformReportRepository reportRepository;
    private final CommunityFeedService communityFeedService;
    private final UserProfileRepository userProfileRepository;
    private final AdminBanService adminBanService;
    private final AdminWarningService adminWarningService;

    public AdminReportService(
        PlatformReportRepository reportRepository,
        CommunityFeedService communityFeedService,
        UserProfileRepository userProfileRepository,
        AdminBanService adminBanService,
        AdminWarningService adminWarningService
    ) {
        this.reportRepository = reportRepository;
        this.communityFeedService = communityFeedService;
        this.userProfileRepository = userProfileRepository;
        this.adminBanService = adminBanService;
        this.adminWarningService = adminWarningService;
    }

    @Transactional(readOnly = true)
    public List<PlatformReportResponse> listReports(
        String status,
        String category,
        String targetType,
        String query,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return reportRepository.search(
            normalizeOptional(status),
            normalizeCategory(category),
            normalizeTargetType(targetType),
            normalizeQuery(query),
            PageRequest.of(0, safeLimit)
        ).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlatformReportResponse getReport(UUID reportId) {
        return toResponse(findReport(reportId));
    }

    @Transactional(readOnly = true)
    public ReportAnalyticsResponse getAnalytics() {
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : reportRepository.countGroupByCategory()) {
            byCategory.put((String) row[0], (Long) row[1]);
        }
        return new ReportAnalyticsResponse(
            reportRepository.count(),
            reportRepository.countByStatus("pending"),
            reportRepository.countByStatus("under_review"),
            reportRepository.countByStatus("resolved"),
            reportRepository.countByStatus("escalated"),
            byCategory
        );
    }

    @Transactional
    public PlatformReportResponse markUnderReview(UUID reportId, UUID adminId, String adminUsername) {
        PlatformReport report = findReport(reportId);
        report.setStatus("under_review");
        report.setReviewedById(adminId);
        report.setReviewedByUsername(adminUsername);
        return toResponse(reportRepository.save(report));
    }

    @Transactional
    public PlatformReportResponse escalateReport(
        UUID reportId,
        UUID adminId,
        String adminUsername,
        String roles
    ) {
        requireAdmin(roles);
        PlatformReport report = findReport(reportId);
        if ("resolved".equals(report.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resolved reports cannot be escalated");
        }
        report.setStatus("escalated");
        report.setReviewedById(adminId);
        report.setReviewedByUsername(adminUsername);
        return toResponse(reportRepository.save(report));
    }

    @Transactional
    public PlatformReportResponse applyAction(
        UUID reportId,
        UUID adminId,
        String adminUsername,
        String roles,
        ApplyReportActionRequest request
    ) {
        requireAdmin(roles);
        PlatformReport report = findReport(reportId);
        String action = normalizeAction(request.action());

        switch (action) {
            case "content_removal" -> handleContentRemoval(report);
            case "warning" -> handleWarning(report, adminId, adminUsername, request);
            case "temp_ban", "permanent_ban" -> {
                UUID banTarget = resolveBanTargetAccountId(report)
                    .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot ban: no user account linked to this report. "
                            + "Link the report to a user profile or post author first."
                    ));
                report.setTargetAccountId(banTarget);
                handleBan(report, banTarget, action, adminId, adminUsername, request);
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown action: " + action);
        }

        report.setStatus("resolved");
        report.setAdminAction(action);
        report.setAdminNote(request.note() != null ? request.note().trim() : null);
        report.setReviewedById(adminId);
        report.setReviewedByUsername(adminUsername);
        report.setResolvedAt(Instant.now());
        return toResponse(reportRepository.save(report));
    }

    private void handleWarning(
        PlatformReport report,
        UUID adminId,
        String adminUsername,
        ApplyReportActionRequest request
    ) {
        UUID target = resolveBanTargetAccountId(report).orElse(report.getTargetAccountId());
        if (target == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot issue warning: no user account linked to this report"
            );
        }
        String username = resolveUsername(target, report.getTargetSummary());
        String reason = request.note() != null && !request.note().isBlank()
            ? request.note().trim()
            : report.getDetails() != null ? report.getDetails() : "Community guidelines violation";
        adminWarningService.createWarningFromReport(target, username, reason, report.getId(), adminId, adminUsername);
    }

    private void handleBan(
        PlatformReport report,
        UUID banTarget,
        String action,
        UUID adminId,
        String adminUsername,
        ApplyReportActionRequest request
    ) {
        String username = resolveUsername(banTarget, report.getTargetSummary());
        String reason = request.note() != null && !request.note().isBlank()
            ? request.note().trim()
            : report.getDetails() != null ? report.getDetails() : "Reported violation";
        String banType = "permanent_ban".equals(action) ? "permanent" : "temporary";
        adminBanService.createBanFromReport(
            banTarget,
            username,
            banType,
            reason,
            report.getId(),
            adminId,
            adminUsername,
            "temporary".equals(banType) ? 7 : null
        );
    }

    private String resolveUsername(UUID accountId, String fallbackSummary) {
        return userProfileRepository.findById(accountId)
            .map(UserProfile::getUsername)
            .orElseGet(() -> {
                String extracted = extractUsername(fallbackSummary);
                return extracted != null ? extracted : "user";
            });
    }

    private void handleContentRemoval(PlatformReport report) {
        if (!"post".equals(report.getTargetType())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Content removal only applies to post reports"
            );
        }
        CommunityPost post = resolvePost(report)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No community post found matching: " + report.getTargetSummary()
            ));
        communityFeedService.adminRemovePost(post.getId());
        report.setTargetId(post.getId());
        report.setTargetAccountId(post.getAuthorId());
    }

    private Optional<CommunityPost> resolvePost(PlatformReport report) {
        if (report.getTargetId() != null) {
            Optional<CommunityPost> byId = communityFeedService.findPostById(report.getTargetId());
            if (byId.isPresent()) {
                return byId;
            }
        }
        return communityFeedService.findPostByContentHint(report.getTargetSummary());
    }

    private Optional<UUID> resolveBanTargetAccountId(PlatformReport report) {
        if (report.getTargetAccountId() != null) {
            return Optional.of(report.getTargetAccountId());
        }
        if ("post".equals(report.getTargetType())) {
            return resolvePost(report).map(CommunityPost::getAuthorId);
        }
        if ("user".equals(report.getTargetType())) {
            String username = extractUsername(report.getTargetSummary());
            if (username != null) {
                return userProfileRepository.findByUsername(username).map(UserProfile::getId);
            }
        }
        return Optional.empty();
    }

    private String extractUsername(String summary) {
        if (summary == null || summary.isBlank()) {
            return null;
        }
        String trimmed = summary.trim();
        if (trimmed.startsWith("@")) {
            return trimmed.substring(1);
        }
        return trimmed;
    }

    private PlatformReport findReport(UUID id) {
        return reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    private PlatformReportResponse toResponse(PlatformReport report) {
        UUID banTarget = resolveBanTargetAccountId(report).orElse(null);

        return new PlatformReportResponse(
            report.getId(),
            report.getReportCode(),
            report.getCategory(),
            categoryLabel(report.getCategory()),
            report.getTargetType(),
            targetTypeLabel(report.getTargetType()),
            report.getTargetId(),
            report.getTargetSummary(),
            report.getTargetAccountId(),
            report.getReporterId(),
            report.getReporterUsername(),
            report.getDetails(),
            report.getStatus(),
            statusLabel(report.getStatus()),
            report.getAdminAction(),
            report.getAdminAction() != null ? actionLabel(report.getAdminAction()) : null,
            report.getAdminNote(),
            report.getReviewedByUsername(),
            report.getCreatedAt(),
            formatDate(report.getCreatedAt()),
            report.getResolvedAt(),
            banTarget
        );
    }

    private String categoryLabel(String category) {
        return switch (category) {
            case "harassment" -> "Harassment";
            case "spam" -> "Spam";
            case "fake_profile" -> "Fake profile";
            case "abusive_language" -> "Abusive language";
            case "scam_attempt" -> "Scam attempt";
            default -> category;
        };
    }

    private String targetTypeLabel(String type) {
        return switch (type) {
            case "user" -> "User";
            case "post" -> "Post";
            case "room" -> "Room";
            case "message" -> "Message";
            default -> type;
        };
    }

    private String statusLabel(String status) {
        return switch (status) {
            case "under_review" -> "Under Review";
            case "resolved" -> "Resolved";
            case "escalated" -> "Escalated";
            default -> "Pending";
        };
    }

    private String actionLabel(String action) {
        return switch (action) {
            case "temp_ban" -> "Temporary ban";
            case "permanent_ban" -> "Permanent ban";
            case "content_removal" -> "Content removed";
            case "warning" -> "Warning issued";
            default -> action;
        };
    }

    private String formatDate(Instant instant) {
        return DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)
            .format(instant.atZone(ZoneId.systemDefault()));
    }

    private String normalizeAction(String action) {
        String a = action.trim().toLowerCase(Locale.ROOT);
        if (!ACTIONS.contains(a)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action: " + action);
        }
        return a;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return null;
        }
        String c = category.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        return CATEGORIES.contains(c) ? c : null;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value)) {
            return null;
        }
        String v = value.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        return STATUSES.contains(v) ? v : null;
    }

    private String normalizeQuery(String query) {
        return query != null && !query.isBlank() ? query.trim() : null;
    }

    private String normalizeTargetType(String targetType) {
        if (targetType == null || targetType.isBlank() || "all".equalsIgnoreCase(targetType)) {
            return null;
        }
        String normalized = targetType.trim().toLowerCase(Locale.ROOT);
        return Set.of("user", "post", "room", "message").contains(normalized) ? normalized : null;
    }

    private void requireAdmin(String roles) {
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("ADMIN") && !upper.contains("MODERATOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }
}
