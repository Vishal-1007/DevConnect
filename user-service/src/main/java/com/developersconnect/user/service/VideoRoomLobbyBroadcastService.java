package com.developersconnect.user.service;

import com.developersconnect.user.config.ChatServiceProperties;
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
public class VideoRoomLobbyBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(VideoRoomLobbyBroadcastService.class);

    private final RestTemplate restTemplate;
    private final ChatServiceProperties properties;

    public VideoRoomLobbyBroadcastService(RestTemplate restTemplate, ChatServiceProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void broadcast(String type, UUID roomId) {
        if (properties.baseUrl() == null || properties.baseUrl().isBlank()) {
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (properties.internalApiKey() != null && !properties.internalApiKey().isBlank()) {
                headers.set("X-Internal-Api-Key", properties.internalApiKey());
            }
            Map<String, Object> body = Map.of(
                "type", type,
                "roomId", roomId.toString()
            );
            restTemplate.postForEntity(
                properties.baseUrl() + "/internal/video-rooms/broadcast",
                new HttpEntity<>(body, headers),
                Map.class
            );
        } catch (Exception ex) {
            log.debug("Video room lobby broadcast skipped: {}", ex.getMessage());
        }
    }
}
