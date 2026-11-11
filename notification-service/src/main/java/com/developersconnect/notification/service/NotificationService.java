package com.developersconnect.notification.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.notification.dto.CreateNotificationRequest;
import com.developersconnect.notification.dto.DeliverCampaignRequest;
import com.developersconnect.notification.dto.DeliverCampaignResponse;
import com.developersconnect.notification.dto.DeliveryAnalyticsResponse;
import com.developersconnect.notification.dto.NotificationResponse;
import com.developersconnect.notification.dto.NotifyUsersRequest;
import com.developersconnect.notification.model.Notification;
import com.developersconnect.notification.model.PlatformNotification;
import com.developersconnect.notification.repository.NotificationRepository;
import com.developersconnect.notification.repository.PlatformNotificationRepository;

@Service
public class NotificationService {

    private static final int BATCH_SIZE = 200;

    private final NotificationRepository notificationRepository;
    private final PlatformNotificationRepository platformNotificationRepository;
    private final NotificationPushService notificationPushService;
    private final Environment environment;

    public NotificationService(
        NotificationRepository notificationRepository,
        PlatformNotificationRepository platformNotificationRepository,
        NotificationPushService notificationPushService,
        Environment environment
    ) {
        this.notificationRepository = notificationRepository;
        this.platformNotificationRepository = platformNotificationRepository;
        this.notificationPushService = notificationPushService;
        this.environment = environment;
    }

    @Transactional
    public NotificationResponse create(CreateNotificationRequest request) {
        Notification notification = buildUserNotification(
            request.userId(),
            normalizeType(request.type()),
            request.title(),
            request.body(),
            null
        );
        Notification saved = notificationRepository.save(notification);
        pushRealtime(saved);
        return toResponse(saved);
    }

    @Transactional
    public DeliverCampaignResponse deliverCampaign(DeliverCampaignRequest request) {
        PlatformNotification platform = new PlatformNotification();
        platform.setCampaignId(request.campaignId());
        platform.setTitle(request.title().trim());
        platform.setMessage(request.message().trim());
        platform.setType(normalizeType(request.type()));
        platform.setAudienceType(request.audienceType().toUpperCase(Locale.ROOT));
        platform.setStatus("SENT");
        platform.setCreatedBy(request.createdBy());
        platform.setCreatedByUsername(request.createdByUsername());
        PlatformNotification savedPlatform = platformNotificationRepository.save(platform);

        int delivered = deliverToUsers(
            savedPlatform.getId(),
            savedPlatform.getType(),
            savedPlatform.getTitle(),
            savedPlatform.getMessage(),
            request.userIds()
        );

        return new DeliverCampaignResponse(savedPlatform.getId(), delivered);
    }

    @Transactional
    public DeliverCampaignResponse notifyUsers(NotifyUsersRequest request) {
        PlatformNotification platform = new PlatformNotification();
        platform.setTitle(request.title().trim());
        platform.setMessage(request.message().trim());
        platform.setType(normalizeType(request.type()));
        platform.setAudienceType(request.audienceType().toUpperCase(Locale.ROOT));
        platform.setStatus("SENT");
        platform.setCreatedBy(request.createdBy());
        PlatformNotification savedPlatform = platformNotificationRepository.save(platform);

        int delivered = deliverToUsers(
            savedPlatform.getId(),
            savedPlatform.getType(),
            savedPlatform.getTitle(),
            savedPlatform.getMessage(),
            request.userIds()
        );

        return new DeliverCampaignResponse(savedPlatform.getId(), delivered);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId, int limit, String filter) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);

        if (environment.matchesProfiles("local")
            && notificationRepository.countByUserId(userId) == 0) {
            seedWelcomeNotifications(userId);
        }

        String normalizedFilter = filter == null ? "all" : filter.toLowerCase(Locale.ROOT);
        if (!Set.of("all", "unread", "read").contains(normalizedFilter)) {
            normalizedFilter = "all";
        }

        List<Notification> notifications = notificationRepository.findForUser(
            userId,
            normalizedFilter,
            PageRequest.of(0, safeLimit)
        );
        return notifications.stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadAtIsNullAndDeletedAtIsNull(userId);
    }

    @Transactional(readOnly = true)
    public DeliveryAnalyticsResponse deliveryAnalytics() {
        long delivered = notificationRepository.countByDeletedAtIsNull();
        long read = notificationRepository.countByReadAtIsNotNullAndDeletedAtIsNull();
        long unread = notificationRepository.countByReadAtIsNullAndDeletedAtIsNull();
        return new DeliveryAnalyticsResponse(delivered, delivered, read, unread);
    }

    @Transactional
    public NotificationResponse markRead(UUID notificationId, UUID userId) {
        Notification notification = findOwned(notificationId, userId);
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    @Transactional
    public int markAllRead(UUID userId) {
        return notificationRepository.markAllReadForUser(userId, Instant.now());
    }

    @Transactional
    public void delete(UUID notificationId, UUID userId) {
        Notification notification = findOwned(notificationId, userId);
        if (notification.getDeletedAt() == null) {
            notification.setDeletedAt(Instant.now());
            notificationRepository.save(notification);
        }
    }

    private Notification findOwned(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        if (notification.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        return notification;
    }

    private int deliverToUsers(
        UUID platformNotificationId,
        String type,
        String title,
        String body,
        List<UUID> userIds
    ) {
        List<UUID> uniqueIds = userIds.stream().distinct().toList();
        if (uniqueIds.isEmpty()) {
            return 0;
        }

        int delivered = 0;
        List<Notification> batch = new ArrayList<>(BATCH_SIZE);

        for (UUID userId : uniqueIds) {
            batch.add(buildUserNotification(userId, type, title, body, platformNotificationId));
            if (batch.size() >= BATCH_SIZE) {
                delivered += saveAndPushBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            delivered += saveAndPushBatch(batch);
        }

        return delivered;
    }

    private int saveAndPushBatch(List<Notification> batch) {
        List<Notification> saved = notificationRepository.saveAll(batch);
        for (Notification notification : saved) {
            pushRealtime(notification);
        }
        return saved.size();
    }

    private Notification buildUserNotification(
        UUID userId,
        String type,
        String title,
        String body,
        UUID platformNotificationId
    ) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setPlatformNotificationId(platformNotificationId);
        return notification;
    }

    private void pushRealtime(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "notification");
        payload.put("id", notification.getId().toString());
        payload.put("type", notification.getType());
        payload.put("title", notification.getTitle());
        payload.put("body", notification.getBody());
        payload.put("createdAt", notification.getCreatedAt().toString());
        notificationPushService.pushToUser(notification.getUserId().toString(), payload);
    }

    private String normalizeType(String type) {
        return type == null ? "ANNOUNCEMENT" : type.toLowerCase(Locale.ROOT);
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getUserId(),
            notification.getType(),
            notification.getTitle(),
            notification.getBody(),
            notification.getReadAt(),
            notification.getCreatedAt(),
            notification.getDeliveredAt(),
            notification.getPlatformNotificationId()
        );
    }

    private void seedWelcomeNotifications(UUID userId) {
        saveNotification(
            userId,
            "welcome",
            "Welcome to DevConnect",
            "Your account is ready. Explore mentors, join video rooms, and start matching."
        );
        saveNotification(
            userId,
            "match",
            "Find your next match",
            "Developers are online now — try Find Match to pair with a mentor or peer."
        );
        saveNotification(
            userId,
            "community",
            "Community updates",
            "New events and video rooms were added to the community section this week."
        );
    }

    private void saveNotification(UUID userId, String type, String title, String body) {
        notificationRepository.save(buildUserNotification(userId, type, title, body, null));
    }
}
