package com.developersconnect.matching.service;

import com.developersconnect.matching.config.ChatServiceProperties;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/** Pushes real-time match events through chat-service STOMP relay. */
@Service
public class MatchEventNotifier {

    private static final Logger log = LoggerFactory.getLogger(MatchEventNotifier.class);

    private final RestTemplate restTemplate;
    private final ChatServiceProperties chatServiceProperties;

    public MatchEventNotifier(RestTemplate restTemplate, ChatServiceProperties chatServiceProperties) {
        this.restTemplate = restTemplate;
        this.chatServiceProperties = chatServiceProperties;
    }

    public void notifyUser(
        String toUserId,
        String type,
        String fromUserId,
        String fromName,
        String assignmentId,
        String criteria,
        String partnerRole,
        String status
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("to", toUserId);
        payload.put("from", fromUserId);
        payload.put("fromName", fromName);
        payload.put("assignmentId", assignmentId);
        payload.put("criteria", criteria);
        payload.put("partnerRole", partnerRole);
        payload.put("status", status);

        try {
            restTemplate.postForEntity(
                chatServiceProperties.baseUrl() + "/api/internal/signal/push",
                payload,
                Void.class
            );
        } catch (Exception ex) {
            log.warn("Failed to push match event {} to {}: {}", type, toUserId, ex.getMessage());
        }
    }
}
