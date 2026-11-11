package com.developersconnect.user.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.developersconnect.user.config.NotificationServiceProperties;
import com.developersconnect.user.dto.DeliverCampaignResponse;
import com.developersconnect.user.dto.DeliveryAnalyticsResponse;

@Service
public class NotificationDeliveryClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationDeliveryClient.class);
    private static final DeliveryAnalyticsResponse EMPTY_ANALYTICS =
        new DeliveryAnalyticsResponse(0, 0, 0, 0);

    private final RestTemplate restTemplate;
    private final NotificationServiceProperties properties;

    public NotificationDeliveryClient(RestTemplate restTemplate, NotificationServiceProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public int deliverCampaign(
        UUID campaignId,
        String title,
        String body,
        String notificationType,
        String audience,
        UUID createdById,
        String createdByUsername,
        List<UUID> userIds
    ) {
        if (userIds.isEmpty()) {
            return 0;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("campaignId", campaignId);
        payload.put("title", title);
        payload.put("message", body);
        payload.put("type", notificationType);
        payload.put("audienceType", audience);
        payload.put("createdBy", createdById);
        payload.put("createdByUsername", createdByUsername);
        payload.put("userIds", userIds);

        try {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, internalHeaders());
            ResponseEntity<DeliverCampaignResponse> response = restTemplate.postForEntity(
                properties.baseUrl() + "/api/notifications/internal/campaign-deliver",
                request,
                DeliverCampaignResponse.class
            );
            DeliverCampaignResponse deliverResponse = response.getBody();
            return deliverResponse != null ? deliverResponse.deliveredCount() : 0;
        } catch (RuntimeException ex) {
            log.error("Failed to deliver campaign {} to notification-service: {}", campaignId, ex.getMessage());
            throw ex;
        }
    }

    public DeliveryAnalyticsResponse fetchDeliveryAnalytics() {
        String url = properties.baseUrl() + "/api/notifications/internal/analytics";
        HttpEntity<Void> request = new HttpEntity<>(internalHeaders());
        try {
            ResponseEntity<DeliveryAnalyticsResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                DeliveryAnalyticsResponse.class
            );
            DeliveryAnalyticsResponse analytics = response.getBody();
            return analytics != null ? analytics : EMPTY_ANALYTICS;
        } catch (RuntimeException ex) {
            log.warn("Failed to fetch notification delivery analytics: {}", ex.getMessage());
            return EMPTY_ANALYTICS;
        }
    }

    private HttpHeaders internalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Api-Key", properties.internalApiKey());
        return headers;
    }
}
