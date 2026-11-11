package com.developersconnect.chat.signal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Pure relay: any STOMP client publishes to /app/signal,
 * the message is forwarded to /topic/signal/{to} so the target user
 * (subscribed to that topic) receives it.
 *
 * Supported message types:
 *   call-request  — caller → callee  (incoming call notification)
 *   call-accept   — callee → caller  (callee accepted)
 *   call-reject   — callee → caller  (callee rejected)
 *   offer         — caller → callee  (WebRTC SDP offer)
 *   answer        — callee → caller  (WebRTC SDP answer)
 *   ice           — both sides       (ICE candidate exchange)
 */
@Controller
public class SignalingController {

    private final SimpMessagingTemplate messaging;

    public SignalingController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @MessageMapping("/signal")
    public void relay(SignalingMessage msg) {
        if (msg.to() == null || msg.to().isBlank()) return;
        messaging.convertAndSend("/topic/signal/" + msg.to(), msg);
    }
}
