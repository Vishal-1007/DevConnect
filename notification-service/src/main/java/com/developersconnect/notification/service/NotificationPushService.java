package com.developersconnect.notification.service;

import com.developersconnect.notification.config.ChatServiceProperties;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NotificationPushService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPushService.class);

    private final RestTemplate restTemplate;
    private final ChatServiceProperties chatServiceProperties;

    public NotificationPushService(RestTemplate restTemplate, ChatServiceProperties chatServiceProperties) {
        this.restTemplate = restTemplate;
        this.chatServiceProperties = chatServiceProperties;
    }

    public void pushToUser(String userId, Map<String, Object> notificationPayload) {
        Map<String, Object> payload = new HashMap<>(notificationPayload);
        payload.put("to", userId);
        try {
            restTemplate.postForEntity(
                chatServiceProperties.baseUrl() + "/api/internal/notifications/push",
                payload,
                Void.class
            );
        } catch (Exception ex) {
            log.warn("Failed to push notification to {}: {}", userId, ex.getMessage());
        }
    }
}
