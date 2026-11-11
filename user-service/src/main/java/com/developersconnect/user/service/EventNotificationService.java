package com.developersconnect.user.service;

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

import com.developersconnect.user.config.NotificationServiceProperties;

@Service
public class EventNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EventNotificationService.class);

    private final RestTemplate restTemplate;
    private final NotificationServiceProperties properties;

    public EventNotificationService(RestTemplate restTemplate, NotificationServiceProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void notifyUser(UUID userId, String title, String message, String type) {
        notifyUsers(List.of(userId), title, message, type);
    }

    public void notifyUsers(List<UUID> userIds, String title, String message, String type) {
        if (properties.baseUrl() == null || properties.baseUrl().isBlank() || userIds.isEmpty()) {
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (properties.internalApiKey() != null && !properties.internalApiKey().isBlank()) {
                headers.set("X-Internal-Api-Key", properties.internalApiKey());
            }
            Map<String, Object> body = Map.of(
                "title", title,
                "message", message,
                "type", type,
                "audienceType", "SPECIFIC_USERS",
                "userIds", userIds
            );
            restTemplate.postForEntity(
                properties.baseUrl() + "/api/notifications/internal/notify-users",
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (Exception ex) {
            log.debug("Event notification skipped: {}", ex.getMessage());
        }
    }
}
