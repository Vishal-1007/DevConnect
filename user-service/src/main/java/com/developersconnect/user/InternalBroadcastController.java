package com.developersconnect.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.config.NotificationServiceProperties;
import com.developersconnect.user.dto.InternalBroadcastRequest;
import com.developersconnect.user.service.InternalBroadcastService;

import jakarta.validation.Valid;

/** Internal broadcast used by mentor-service and other platform services. */
@RestController
@RequestMapping("/api/users/internal/notifications")
public class InternalBroadcastController {

    private final InternalBroadcastService internalBroadcastService;
    private final NotificationServiceProperties notificationServiceProperties;

    public InternalBroadcastController(
        InternalBroadcastService internalBroadcastService,
        NotificationServiceProperties notificationServiceProperties
    ) {
        this.internalBroadcastService = internalBroadcastService;
        this.notificationServiceProperties = notificationServiceProperties;
    }

    @PostMapping("/broadcast")
    public int broadcast(
        @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
        @Valid @RequestBody InternalBroadcastRequest request
    ) {
        assertInternalKey(apiKey);
        return internalBroadcastService.broadcast(request);
    }

    private void assertInternalKey(String apiKey) {
        if (apiKey == null || !apiKey.equals(notificationServiceProperties.internalApiKey())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid internal API key");
        }
    }
}
