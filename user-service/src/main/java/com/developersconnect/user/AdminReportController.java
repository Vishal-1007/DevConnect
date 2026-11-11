package com.developersconnect.user;

import com.developersconnect.user.dto.ApplyReportActionRequest;
import com.developersconnect.user.dto.PlatformReportResponse;
import com.developersconnect.user.dto.ReportAnalyticsResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminReportService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/reports")
public class AdminReportController {

    private final AdminReportService adminReportService;

    public AdminReportController(AdminReportService adminReportService) {
        this.adminReportService = adminReportService;
    }

    @GetMapping
    public ResponseEntity<List<PlatformReportResponse>> listReports(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String targetType,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminReportService.listReports(status, category, targetType, q, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ReportAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminReportService.getAnalytics());
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<PlatformReportResponse> getReport(@PathVariable UUID reportId) {
        return ResponseEntity.ok(adminReportService.getReport(reportId));
    }

    @PostMapping("/{reportId}/review")
    public ResponseEntity<PlatformReportResponse> markUnderReview(
        Authentication authentication,
        @PathVariable UUID reportId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminReportService.markUnderReview(reportId, principal.accountId(), principal.username())
        );
    }

    @PostMapping("/{reportId}/escalate")
    public ResponseEntity<PlatformReportResponse> escalateReport(
        Authentication authentication,
        @PathVariable UUID reportId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminReportService.escalateReport(
                reportId,
                principal.accountId(),
                principal.username(),
                principal.roles()
            )
        );
    }

    @PostMapping("/{reportId}/action")
    public ResponseEntity<PlatformReportResponse> applyAction(
        Authentication authentication,
        @PathVariable UUID reportId,
        @Valid @RequestBody ApplyReportActionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminReportService.applyAction(
                reportId,
                principal.accountId(),
                principal.username(),
                principal.roles(),
                request
            )
        );
    }
}
