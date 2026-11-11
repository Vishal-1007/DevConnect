package com.developersconnect.user;

import com.developersconnect.user.dto.CreateNotificationCampaignRequest;
import com.developersconnect.user.dto.NotificationAnalyticsResponse;
import com.developersconnect.user.dto.NotificationCampaignResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminNotificationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/notifications")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    public AdminNotificationController(AdminNotificationService adminNotificationService) {
        this.adminNotificationService = adminNotificationService;
    }

    @GetMapping("/campaigns")
    public ResponseEntity<List<NotificationCampaignResponse>> listCampaigns() {
        return ResponseEntity.ok(adminNotificationService.listCampaigns());
    }

    @GetMapping("/analytics")
    public ResponseEntity<NotificationAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminNotificationService.getAnalytics());
    }

    @PostMapping("/campaigns")
    public ResponseEntity<NotificationCampaignResponse> createCampaign(
        Authentication authentication,
        @Valid @RequestBody CreateNotificationCampaignRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminNotificationService.createCampaign(
                request,
                principal.accountId(),
                principal.username()
            ));
    }

    @PostMapping("/campaigns/{campaignId}/send")
    public ResponseEntity<NotificationCampaignResponse> sendCampaign(
        Authentication authentication,
        @PathVariable UUID campaignId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminNotificationService.sendCampaign(campaignId, principal.username())
        );
    }

    @DeleteMapping("/campaigns/{campaignId}")
    public ResponseEntity<Void> cancelCampaign(@PathVariable UUID campaignId) {
        adminNotificationService.cancelCampaign(campaignId);
        return ResponseEntity.noContent().build();
    }
}
