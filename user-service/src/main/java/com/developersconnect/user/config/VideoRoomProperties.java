package com.developersconnect.user.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.video-rooms")
public record VideoRoomProperties(
    int freeMaxParticipants,
    int freeDurationMinutes,
    int freeRoomCooldownHours,
    int premiumPriceInr,
    int premiumPriceCents,
    String joinPathPrefix,
    String frontendBaseUrl
) {
    public VideoRoomProperties {
        if (freeMaxParticipants <= 0) {
            freeMaxParticipants = 6;
        }
        if (freeDurationMinutes <= 0) {
            freeDurationMinutes = 30;
        }
        if (freeRoomCooldownHours <= 0) {
            freeRoomCooldownHours = 24;
        }
        if (premiumPriceInr <= 0) {
            premiumPriceInr = 50;
        }
        if (premiumPriceCents <= 0) {
            premiumPriceCents = 5000;
        }
        if (joinPathPrefix == null || joinPathPrefix.isBlank()) {
            joinPathPrefix = "/video-rooms/join/";
        }
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            frontendBaseUrl = "http://localhost:5173";
        }
    }
}
