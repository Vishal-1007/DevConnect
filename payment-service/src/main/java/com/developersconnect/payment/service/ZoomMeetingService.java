package com.developersconnect.payment.service;

import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class ZoomMeetingService {

    private static final String MEETINGS_URL = "https://api.zoom.us/v2/users/me/meetings";

    private final RecruiterIntegrationRepository repository;
    private final ZoomOAuthService zoomOAuthService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ZoomMeetingService(
        RecruiterIntegrationRepository repository,
        ZoomOAuthService zoomOAuthService,
        ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.zoomOAuthService = zoomOAuthService;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public String createMeetingLink(
        java.util.UUID recruiterId,
        String topic,
        Instant start,
        int durationMinutes
    ) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.ZOOM)
            .filter(RecruiterIntegration::isConnected)
            .orElse(null);
        if (integration == null) {
            return null;
        }

        RecruiterIntegration refreshed = zoomOAuthService.refreshAccessTokenIfNeeded(integration);
        ObjectNode body = objectMapper.createObjectNode();
        body.put("topic", topic);
        body.put("type", 2);
        body.put("start_time", DateTimeFormatter.ISO_INSTANT.format(start));
        body.put("duration", durationMinutes);
        body.put("timezone", "UTC");

        JsonNode response = restClient.post()
            .uri(MEETINGS_URL)
            .header("Authorization", "Bearer " + refreshed.getAccessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .body(body.toString())
            .retrieve()
            .body(JsonNode.class);

        if (response == null) {
            return null;
        }
        if (response.hasNonNull("join_url")) {
            return response.get("join_url").asText();
        }
        return null;
    }
}
