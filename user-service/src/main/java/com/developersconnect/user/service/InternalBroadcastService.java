package com.developersconnect.user.service;

import com.developersconnect.user.dto.InternalBroadcastRequest;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class InternalBroadcastService {

    private final UserProfileRepository userProfileRepository;
    private final NotificationDeliveryClient notificationDeliveryClient;

    public InternalBroadcastService(
        UserProfileRepository userProfileRepository,
        NotificationDeliveryClient notificationDeliveryClient
    ) {
        this.userProfileRepository = userProfileRepository;
        this.notificationDeliveryClient = notificationDeliveryClient;
    }

    public int broadcast(InternalBroadcastRequest request) {
        List<UUID> recipients = resolveRecipients(request);
        if (recipients.isEmpty()) {
            return 0;
        }
        return notificationDeliveryClient.deliverCampaign(
            null,
            request.title(),
            request.message(),
            request.type(),
            request.audience(),
            request.createdBy(),
            null,
            recipients
        );
    }

    private List<UUID> resolveRecipients(InternalBroadcastRequest request) {
        String audience = request.audience().toUpperCase(Locale.ROOT);
        return switch (audience) {
            case "LEARNERS" -> userProfileRepository.findAccountIdsByRoleContaining("LEARNER");
            case "MENTORS" -> userProfileRepository.findAccountIdsByRoleContaining("MENTOR");
            case "ADMINS" -> userProfileRepository.findAccountIdsByRoleContaining("ADMIN");
            case "ACTIVE_USERS" -> userProfileRepository.findAccountIdsByUpdatedAtAfter(
                Instant.now().minus(30, ChronoUnit.DAYS)
            );
            case "SPECIFIC_USERS" -> request.specificUserIds() != null ? request.specificUserIds() : List.of();
            default -> userProfileRepository.findAllAccountIds();
        };
    }
}
