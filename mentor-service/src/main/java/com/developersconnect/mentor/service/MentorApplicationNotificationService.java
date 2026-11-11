package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.NotificationServiceProperties;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MentorApplicationNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MentorApplicationNotificationService.class);

    private final RestTemplate restTemplate;
    private final NotificationServiceProperties properties;

    public MentorApplicationNotificationService(
        RestTemplate restTemplate,
        NotificationServiceProperties properties
    ) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void notifyUser(UUID userId, String title, String message, String type) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Api-Key", properties.internalApiKey());
            Map<String, Object> body = Map.of(
                "title", title,
                "message", message,
                "type", type,
                "audienceType", "SPECIFIC_USERS",
                "userIds", List.of(userId)
            );
            restTemplate.postForEntity(
                properties.baseUrl() + "/api/notifications/internal/notify-users",
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (Exception ex) {
            log.warn("Failed to send mentor application notification: {}", ex.getMessage());
        }
    }
}
