package com.developersconnect.user.service;

import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class VideoRoomNotificationService {

    private final PairProgrammingNotificationService notificationClient;

    public VideoRoomNotificationService(PairProgrammingNotificationService notificationClient) {
        this.notificationClient = notificationClient;
    }

    public void notifyInvite(UUID userId, String roomTitle) {
        notificationClient.notifyUser(
            userId,
            "Video room invite",
            "You have been invited to join \"" + roomTitle + "\".",
            "video_room_invite"
        );
    }

    public void notifyExpiryWarning(UUID userId, String roomTitle) {
        notificationClient.notifyUser(
            userId,
            "Meeting ending soon",
            "Your meeting \"" + roomTitle + "\" ends in 5 minutes.",
            "video_room_expiry_warning"
        );
    }

    public void notifyPremiumActivated(UUID userId) {
        notificationClient.notifyUser(
            userId,
            "Video Room Pro activated",
            "Video Room Pro Activated. Enjoy unlimited meetings.",
            "video_room_premium"
        );
    }

    public void notifyRoomExpired(UUID userId, String roomTitle) {
        notificationClient.notifyUser(
            userId,
            "Free meeting ended",
            "Your free meeting \"" + roomTitle + "\" has ended. Upgrade for ₹50 for unlimited meetings.",
            "video_room_expired"
        );
    }
}
