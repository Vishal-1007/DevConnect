package com.developersconnect.user.service;

import com.developersconnect.user.config.ChatServiceProperties;
import java.util.HashMap;
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
public class VideoRoomInRoomBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(VideoRoomInRoomBroadcastService.class);

    private final RestTemplate restTemplate;
    private final ChatServiceProperties properties;

    public VideoRoomInRoomBroadcastService(RestTemplate restTemplate, ChatServiceProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void signal(
        String type,
        UUID roomId,
        UUID fromUserId,
        UUID toUserId,
        String fromName,
        UUID targetUserId
    ) {
        if (properties.baseUrl() == null || properties.baseUrl().isBlank()) {
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (properties.internalApiKey() != null && !properties.internalApiKey().isBlank()) {
                headers.set("X-Internal-Api-Key", properties.internalApiKey());
            }
            Map<String, Object> body = new HashMap<>();
            body.put("type", type);
            body.put("roomId", roomId.toString());
            if (fromUserId != null) {
                body.put("from", fromUserId.toString());
            }
            if (toUserId != null) {
                body.put("to", toUserId.toString());
            }
            if (fromName != null && !fromName.isBlank()) {
                body.put("fromName", fromName);
            }
            if (targetUserId != null) {
                body.put("targetUserId", targetUserId.toString());
            }
            restTemplate.postForEntity(
                properties.baseUrl() + "/internal/video-rooms/room-signal",
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (Exception ex) {
            log.debug("Video room in-room signal skipped: {}", ex.getMessage());
        }
    }
}
