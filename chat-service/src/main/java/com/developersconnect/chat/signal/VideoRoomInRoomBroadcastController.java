package com.developersconnect.chat.signal;

import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal endpoint for user-service to push in-room host control and join approval events.
 * Clients subscribe to {@code /topic/video-room/{roomId}}.
 */
@RestController
@RequestMapping("/internal/video-rooms")
public class VideoRoomInRoomBroadcastController {

    private final SimpMessagingTemplate messaging;

    public VideoRoomInRoomBroadcastController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @PostMapping("/room-signal")
    public void roomSignal(@RequestBody Map<String, Object> body) {
        Object roomId = body.get("roomId");
        Object type = body.get("type");
        if (roomId == null || type == null) {
            return;
        }
        messaging.convertAndSend("/topic/video-room/" + roomId, body);
    }
}
