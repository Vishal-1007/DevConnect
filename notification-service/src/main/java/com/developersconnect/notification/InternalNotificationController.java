package com.developersconnect.notification;

import com.developersconnect.notification.config.InternalApiProperties;
import com.developersconnect.notification.dto.DeliverCampaignRequest;
import com.developersconnect.notification.dto.DeliverCampaignResponse;
import com.developersconnect.notification.dto.DeliveryAnalyticsResponse;
import com.developersconnect.notification.dto.NotifyUsersRequest;
import com.developersconnect.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notifications/internal")
public class InternalNotificationController {

    private final NotificationService notificationService;
    private final InternalApiProperties internalApiProperties;

    public InternalNotificationController(
        NotificationService notificationService,
        InternalApiProperties internalApiProperties
    ) {
        this.notificationService = notificationService;
        this.internalApiProperties = internalApiProperties;
    }

    @PostMapping("/campaign-deliver")
    public ResponseEntity<DeliverCampaignResponse> deliverCampaign(
        @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
        @Valid @RequestBody DeliverCampaignRequest request
    ) {
        assertInternalKey(apiKey);
        return ResponseEntity.ok(notificationService.deliverCampaign(request));
    }

    @PostMapping("/notify-users")
    public ResponseEntity<DeliverCampaignResponse> notifyUsers(
        @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
        @Valid @RequestBody NotifyUsersRequest request
    ) {
        assertInternalKey(apiKey);
        return ResponseEntity.ok(notificationService.notifyUsers(request));
    }

    @GetMapping("/analytics")
    public DeliveryAnalyticsResponse analytics(
        @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey
    ) {
        assertInternalKey(apiKey);
        return notificationService.deliveryAnalytics();
    }

    private void assertInternalKey(String apiKey) {
        if (apiKey == null || !apiKey.equals(internalApiProperties.apiKey())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API key");
        }
    }
}
