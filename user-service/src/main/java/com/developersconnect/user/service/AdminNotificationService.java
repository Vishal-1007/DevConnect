package com.developersconnect.user.service;



import com.developersconnect.user.dto.CreateNotificationCampaignRequest;

import com.developersconnect.user.dto.DeliveryAnalyticsResponse;

import com.developersconnect.user.dto.NotificationAnalyticsResponse;

import com.developersconnect.user.dto.NotificationCampaignResponse;

import com.developersconnect.user.model.PlatformNotificationCampaign;

import com.developersconnect.user.repository.PlatformNotificationCampaignRepository;

import com.developersconnect.user.repository.UserProfileRepository;

import java.time.Instant;

import java.time.ZoneId;

import java.time.format.DateTimeFormatter;

import java.time.temporal.ChronoUnit;

import java.util.LinkedHashSet;

import java.util.List;

import java.util.Locale;

import java.util.Map;

import java.util.Set;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import org.springframework.scheduling.annotation.Scheduled;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;



@Service

public class AdminNotificationService {



    private static final Set<String> AUDIENCES = Set.of(

        "ALL_USERS", "LEARNERS", "MENTORS", "ADMINS", "ACTIVE_USERS", "SPECIFIC_USERS"

    );

    private static final Set<String> TYPES = Set.of(

        "ANNOUNCEMENT",

        "OTP",

        "BOOKING_REMINDER",

        "WEBINAR_ALERT",

        "MENTOR_NOTIFICATION",

        "SYSTEM_ALERT",

        "COURSE_UPDATE",

        "LEARNING_RESOURCE_UPDATE",

        "LEARNING_STREAM_UPDATE",

        "PAYMENT_NOTIFICATION",

        "PROMOTIONAL_CAMPAIGN"

    );

    private static final Map<String, String> AUDIENCE_LABELS = Map.of(

        "ALL_USERS", "All Users",

        "LEARNERS", "Learners",

        "MENTORS", "Mentors",

        "ADMINS", "Admins",

        "ACTIVE_USERS", "Active Users",

        "SPECIFIC_USERS", "Specific Users"

    );

    private static final Map<String, String> TYPE_LABELS = Map.ofEntries(

        Map.entry("ANNOUNCEMENT", "Announcement"),

        Map.entry("OTP", "OTP / Verification"),

        Map.entry("BOOKING_REMINDER", "Booking Reminder"),

        Map.entry("WEBINAR_ALERT", "Webinar Alert"),

        Map.entry("MENTOR_NOTIFICATION", "Mentor Notification"),

        Map.entry("SYSTEM_ALERT", "System Alert"),

        Map.entry("COURSE_UPDATE", "Course Update"),

        Map.entry("LEARNING_RESOURCE_UPDATE", "Learning Resource Update"),

        Map.entry("LEARNING_STREAM_UPDATE", "Learning Stream Update"),

        Map.entry("PAYMENT_NOTIFICATION", "Payment Notification"),

        Map.entry("PROMOTIONAL_CAMPAIGN", "Promotional Campaign")

    );



    private final PlatformNotificationCampaignRepository campaignRepository;

    private final UserProfileRepository userProfileRepository;

    private final SystemLogService systemLogService;

    private final NotificationDeliveryClient notificationDeliveryClient;



    public AdminNotificationService(

        PlatformNotificationCampaignRepository campaignRepository,

        UserProfileRepository userProfileRepository,

        SystemLogService systemLogService,

        NotificationDeliveryClient notificationDeliveryClient

    ) {

        this.campaignRepository = campaignRepository;

        this.userProfileRepository = userProfileRepository;

        this.systemLogService = systemLogService;

        this.notificationDeliveryClient = notificationDeliveryClient;

    }



    @Transactional(readOnly = true)

    public List<NotificationCampaignResponse> listCampaigns() {

        return campaignRepository.findAllByOrderByCreatedAtDesc()

            .stream()

            .map(this::toResponse)

            .toList();

    }



    @Transactional(readOnly = true)

    public NotificationAnalyticsResponse getAnalytics() {

        int totalRecipients = campaignRepository.findAllByOrderByCreatedAtDesc().stream()

            .filter(c -> "SENT".equals(c.getStatus()))

            .mapToInt(PlatformNotificationCampaign::getRecipientCount)

            .sum();

        DeliveryAnalyticsResponse delivery = notificationDeliveryClient.fetchDeliveryAnalytics();

        return new NotificationAnalyticsResponse(

            (int) campaignRepository.count(),

            (int) campaignRepository.countByStatus("SENT"),

            (int) campaignRepository.countByStatus("SCHEDULED"),

            (int) campaignRepository.countByStatus("DRAFT"),

            totalRecipients,

            (int) userProfileRepository.count(),

            delivery.deliveredCount(),

            delivery.readCount(),

            delivery.unreadCount()

        );

    }



    @Transactional

    public NotificationCampaignResponse createCampaign(

        CreateNotificationCampaignRequest request,

        UUID adminId,

        String adminUsername

    ) {

        validateAudience(request.audience());

        validateType(request.notificationType());

        validateSpecificUsers(request);



        PlatformNotificationCampaign campaign = new PlatformNotificationCampaign();

        campaign.setTitle(request.title().trim());

        campaign.setBody(request.body().trim());

        campaign.setAudience(request.audience().toUpperCase(Locale.ROOT));

        campaign.setNotificationType(request.notificationType().toUpperCase(Locale.ROOT));

        campaign.setCreatedById(adminId);

        campaign.setCreatedByUsername(adminUsername);

        if (request.specificUserIds() != null && !request.specificUserIds().isEmpty()) {

            campaign.setSpecificUserIds(new LinkedHashSet<>(request.specificUserIds()));

        }

        campaign.setRecipientCount(estimateRecipients(campaign));



        if (request.sendNow()) {

            return deliver(campaign, adminUsername);

        }



        if (request.scheduledAt() != null && request.scheduledAt().isAfter(Instant.now())) {

            campaign.setStatus("SCHEDULED");

            campaign.setScheduledAt(request.scheduledAt());

            return toResponse(campaignRepository.save(campaign));

        }



        campaign.setStatus("DRAFT");

        return toResponse(campaignRepository.save(campaign));

    }



    @Transactional

    public NotificationCampaignResponse sendCampaign(UUID campaignId, String adminUsername) {

        PlatformNotificationCampaign campaign = campaignRepository.findById(campaignId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found"));

        if ("SENT".equals(campaign.getStatus())) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "Campaign already sent");

        }

        campaign.setRecipientCount(estimateRecipients(campaign));

        return deliver(campaign, adminUsername);

    }



    @Transactional

    public void cancelCampaign(UUID campaignId) {

        PlatformNotificationCampaign campaign = campaignRepository.findById(campaignId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campaign not found"));

        if ("SENT".equals(campaign.getStatus())) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel a sent campaign");

        }

        campaignRepository.delete(campaign);

    }



    @Scheduled(fixedDelay = 60000)

    @Transactional

    public void dispatchScheduledCampaigns() {

        List<PlatformNotificationCampaign> due = campaignRepository.findByStatusAndScheduledAtLessThanEqual(

            "SCHEDULED",

            Instant.now()

        );

        for (PlatformNotificationCampaign campaign : due) {

            campaign.setRecipientCount(estimateRecipients(campaign));

            deliver(campaign, "system");

        }

    }



    private NotificationCampaignResponse deliver(PlatformNotificationCampaign campaign, String actor) {

        List<UUID> recipients = resolveRecipients(campaign);

        campaign.setRecipientCount(recipients.size());



        PlatformNotificationCampaign saved = campaignRepository.save(campaign);

        int delivered = 0;



        if (!recipients.isEmpty()) {

            delivered = notificationDeliveryClient.deliverCampaign(

                saved.getId(),

                saved.getTitle(),

                saved.getBody(),

                saved.getNotificationType(),

                saved.getAudience(),

                saved.getCreatedById(),

                saved.getCreatedByUsername(),

                recipients

            );

        }



        saved.setStatus("SENT");

        saved.setSentAt(Instant.now());

        saved.setScheduledAt(null);

        saved.setRecipientCount(delivered);

        NotificationCampaignResponse response = toResponse(campaignRepository.save(saved));



        systemLogService.record(

            "info",

            "notification-service",

            "general",

            "Campaign '" + campaign.getTitle() + "' delivered to " + delivered + " recipients",

            "type=" + campaign.getNotificationType()

                + " audience=" + campaign.getAudience()

                + " actor=" + actor

        );



        return response;

    }



    private List<UUID> resolveRecipients(PlatformNotificationCampaign campaign) {

        return switch (campaign.getAudience()) {

            case "LEARNERS" -> userProfileRepository.findAccountIdsByRoleContaining("LEARNER");

            case "MENTORS" -> userProfileRepository.findAccountIdsByRoleContaining("MENTOR");

            case "ADMINS" -> userProfileRepository.findAccountIdsByRoleContaining("ADMIN");

            case "ACTIVE_USERS" -> userProfileRepository.findAccountIdsByUpdatedAtAfter(

                Instant.now().minus(30, ChronoUnit.DAYS)

            );

            case "SPECIFIC_USERS" -> campaign.getSpecificUserIds().stream().toList();

            default -> userProfileRepository.findAllAccountIds();

        };

    }



    private int estimateRecipients(PlatformNotificationCampaign campaign) {

        return resolveRecipients(campaign).size();

    }



    private void validateSpecificUsers(CreateNotificationCampaignRequest request) {

        if ("SPECIFIC_USERS".equalsIgnoreCase(request.audience())) {

            if (request.specificUserIds() == null || request.specificUserIds().isEmpty()) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "specificUserIds required for SPECIFIC_USERS audience");

            }

        }

    }



    private void validateAudience(String audience) {

        if (!AUDIENCES.contains(audience.toUpperCase(Locale.ROOT))) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid audience: " + audience);

        }

    }



    private void validateType(String type) {

        if (!TYPES.contains(type.toUpperCase(Locale.ROOT))) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid notification type: " + type);

        }

    }



    private NotificationCampaignResponse toResponse(PlatformNotificationCampaign campaign) {

        Instant displayTime = campaign.getSentAt() != null ? campaign.getSentAt() : campaign.getScheduledAt();

        String sentAtLabel = displayTime != null

            ? DateTimeFormatter.ofPattern("M/d/yyyy", Locale.US)

                .withZone(ZoneId.systemDefault())

                .format(displayTime)

            : "—";



        return new NotificationCampaignResponse(

            campaign.getId(),

            campaign.getTitle(),

            campaign.getBody(),

            campaign.getAudience(),

            AUDIENCE_LABELS.getOrDefault(campaign.getAudience(), campaign.getAudience()),

            campaign.getNotificationType(),

            TYPE_LABELS.getOrDefault(campaign.getNotificationType(), campaign.getNotificationType()),

            campaign.getStatus(),

            statusLabel(campaign.getStatus()),

            campaign.getScheduledAt(),

            campaign.getSentAt(),

            sentAtLabel,

            campaign.getRecipientCount(),

            campaign.getCreatedByUsername(),

            campaign.getCreatedAt()

        );

    }



    private String statusLabel(String status) {

        return switch (status) {

            case "SENT" -> "Sent";

            case "SCHEDULED" -> "Scheduled";

            default -> "Draft";

        };

    }

}


