package com.developersconnect.payment.service;

import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TeamsMeetingService {

    private static final String MEETINGS_URL = "https://graph.microsoft.com/v1.0/me/onlineMeetings";

    private final RecruiterIntegrationRepository repository;
    private final MicrosoftOAuthService microsoftOAuthService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public TeamsMeetingService(
        RecruiterIntegrationRepository repository,
        MicrosoftOAuthService microsoftOAuthService,
        ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.microsoftOAuthService = microsoftOAuthService;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public String createMeetingLink(
        java.util.UUID recruiterId,
        String subject,
        Instant start,
        Instant end
    ) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.MICROSOFT_TEAMS)
            .filter(RecruiterIntegration::isConnected)
            .orElse(null);
        if (integration == null) {
            return null;
        }

        RecruiterIntegration refreshed = microsoftOAuthService.refreshAccessTokenIfNeeded(integration);
        ObjectNode body = objectMapper.createObjectNode();
        body.put("subject", subject);
        ObjectNode startNode = objectMapper.createObjectNode();
        startNode.put("dateTime", start.toString());
        startNode.put("timeZone", "UTC");
        body.set("startDateTime", startNode);
        ObjectNode endNode = objectMapper.createObjectNode();
        endNode.put("dateTime", end.toString());
        endNode.put("timeZone", "UTC");
        body.set("endDateTime", endNode);

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
        if (response.hasNonNull("joinWebUrl")) {
            return response.get("joinWebUrl").asText();
        }
        return null;
    }
}
