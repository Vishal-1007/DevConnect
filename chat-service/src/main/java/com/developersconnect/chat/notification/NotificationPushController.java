package com.developersconnect.chat.notification;

import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Internal endpoint for notification-service to push real-time alerts over STOMP. */
@RestController
@RequestMapping("/api/internal/notifications")
public class NotificationPushController {

    private final SimpMessagingTemplate messaging;

    public NotificationPushController(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @PostMapping("/push")
    public void push(@RequestBody Map<String, Object> payload) {
        Object to = payload.get("to");
        if (to == null || to.toString().isBlank()) {
            return;
        }
        messaging.convertAndSend("/topic/notifications/" + to, payload);
    }
}
