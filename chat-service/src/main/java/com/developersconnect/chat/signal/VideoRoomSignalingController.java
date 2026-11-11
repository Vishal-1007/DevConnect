package com.developersconnect.chat.signal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Relays video-room WebRTC signaling to all subscribers on a room topic.
 *
 * Clients publish to /app/video-room and subscribe to /topic/video-room/{roomId}.
 * Clients must ignore messages where {@code from} equals their own user id.
 */
@Controller
public class VideoRoomSignalingController {

    private final SimpMessagingTemplate messaging;

    public VideoRoomSignalingController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @MessageMapping("/video-room")
    public void relay(VideoRoomSignalingMessage msg) {
        if (msg.roomId() == null || msg.roomId().isBlank()) {
            return;
        }
        if (msg.from() == null || msg.from().isBlank()) {
            return;
        }
        messaging.convertAndSend("/topic/video-room/" + msg.roomId(), msg);
    }
}
