package com.developersconnect.chat.signal;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Relays pair-programming collaboration events to all subscribers on a session topic.
 *
 * Clients publish to /app/pair and subscribe to /topic/pair/{sessionId}.
 */
@Controller
public class PairCollaborationController {

    private final SimpMessagingTemplate messaging;

    public PairCollaborationController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @MessageMapping("/pair")
    public void relay(PairCollaborationMessage msg) {
        if (msg.sessionId() == null || msg.sessionId().isBlank()) return;
        messaging.convertAndSend("/topic/pair/" + msg.sessionId(), msg);
    }
}
