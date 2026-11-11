package com.developersconnect.chat.signal;

import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal endpoint for matching-service to push real-time match events over STOMP. */
@RestController
@RequestMapping("/api/internal/signal")
public class SignalPushController {

    private final SimpMessagingTemplate messaging;

    public SignalPushController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @PostMapping("/push")
    public void push(@RequestBody Map<String, Object> payload) {
        Object to = payload.get("to");
        if (to == null || to.toString().isBlank()) {
            return;
        }
        messaging.convertAndSend("/topic/signal/" + to, payload);
    }
}
