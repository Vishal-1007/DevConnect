package com.developersconnect.chat.signal;

import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal endpoint for user-service to push lobby-wide room lifecycle events.
 * Clients subscribe to {@code /topic/video-rooms/lobby}.
 */
@RestController
@RequestMapping("/internal/video-rooms")
public class VideoRoomLobbyBroadcastController {

    private final SimpMessagingTemplate messaging;

    public VideoRoomLobbyBroadcastController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @PostMapping("/broadcast")
    public void broadcast(@RequestBody Map<String, Object> body) {
        Object type = body.get("type");
        Object roomId = body.get("roomId");
        if (type == null || roomId == null) {
            return;
        }
        messaging.convertAndSend("/topic/video-rooms/lobby", Map.of(
            "type", String.valueOf(type),
            "roomId", String.valueOf(roomId)
        ));
    }
}
