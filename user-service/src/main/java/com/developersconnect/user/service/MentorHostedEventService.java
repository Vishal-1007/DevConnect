package com.developersconnect.user.service;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.dto.CommunityEventResponse;
import com.developersconnect.user.dto.CreateMentorEventRequest;
import com.developersconnect.user.dto.MentorEventRegistrationResponse;
import com.developersconnect.user.dto.MentorHostedEventManageResponse;
import com.developersconnect.user.dto.UpdateMentorEventRequest;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.EventPayment;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
import com.developersconnect.user.repository.EventPaymentRepository;
import com.developersconnect.user.repository.UserProfileRepository;

@Service
public class MentorHostedEventService {

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final EventPaymentRepository paymentRepository;
    private final UserProfileRepository userProfileRepository;
    private final EventResponseMapper responseMapper;
    private final EventNotificationService notificationService;

    public MentorHostedEventService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        EventPaymentRepository paymentRepository,
        UserProfileRepository userProfileRepository,
        EventResponseMapper responseMapper,
        EventNotificationService notificationService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.paymentRepository = paymentRepository;
        this.userProfileRepository = userProfileRepository;
        this.responseMapper = responseMapper;
        this.notificationService = notificationService;
    }

    @Transactional
    public CommunityEventResponse createMentorEvent(
        UUID mentorId,
        String username,
        String roles,
        CreateMentorEventRequest request
    ) {
        ensureMentor(roles);
        validateSchedule(request.startsAt(), request.endsAt());
        ensureProfile(mentorId, username);

        CommunityEvent event = buildBaseEvent(mentorId, request.title(), request.description(),
            request.eventType(), request.category(), request.format(), request.locationOrLink(),
            request.startsAt(), request.endsAt(), request.maxAttendees(), request.tags());
        event.setThumbnailUrl(trimToNull(request.thumbnailUrl()));
        event.setTopicsCovered(trimToNull(request.topicsCovered()));
        event.setRequirements(trimToNull(request.requirements()));
        event.setPaid(request.paid());
        if (request.paid() && request.priceInr() != null && request.priceInr() > 0) {
            event.setPriceInrCents(request.priceInr() * 100);
        }
        event.setHostApprovalStatus("pending");
        if ("webinar".equals(event.getEventType())) {
            event.setWebinarSubtype("mentor");
            event.setStreamStatus("scheduled");
        }

        CommunityEvent saved = eventRepository.save(event);
        registerFree(saved.getId(), mentorId);
        notificationService.notifyUser(
            mentorId,
            "Event submitted",
            "Your event \"" + saved.getTitle() + "\" is pending admin approval",
            "EVENT_PENDING"
        );
        return responseMapper.toResponse(saved, mentorId);
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> listHostedEvents(UUID mentorId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return eventRepository.findAllByHostIdOrderByStartsAtDesc(mentorId, PageRequest.of(0, safeLimit))
            .stream()
            .map(event -> responseMapper.toResponse(event, mentorId))
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorHostedEventManageResponse getHostedEventManage(UUID mentorId, UUID eventId) {
        CommunityEvent event = findHostedEvent(mentorId, eventId);
        return buildManageResponse(event, mentorId);
    }

    @Transactional(readOnly = true)
    public List<MentorEventRegistrationResponse> listHostedEventRegistrations(UUID mentorId, UUID eventId) {
        findHostedEvent(mentorId, eventId);
        return registrationRepository.findAllByEventIdOrderByRegisteredAtAsc(eventId).stream()
            .map(this::toMentorRegistrationResponse)
            .toList();
    }

    @Transactional
    public CommunityEventResponse updateHostedEvent(
        UUID mentorId,
        UUID eventId,
        UpdateMentorEventRequest request
    ) {
        CommunityEvent event = findHostedEvent(mentorId, eventId);
        if (event.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled events cannot be edited");
        }

        if (request.startsAt() != null || request.endsAt() != null) {
            Instant startsAt = request.startsAt() != null ? request.startsAt() : event.getStartsAt();
            Instant endsAt = request.endsAt() != null ? request.endsAt() : event.getEndsAt();
            if (!endsAt.isAfter(startsAt)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
            }
            event.setStartsAt(startsAt);
            event.setEndsAt(endsAt);
        }
        if (request.title() != null) {
            event.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            event.setDescription(request.description().trim());
        }
        if (request.eventType() != null) {
            event.setEventType(normalize(request.eventType(), "webinar"));
        }
        if (request.category() != null) {
            event.setCategory(normalize(request.category(), "general"));
        }
        if (request.format() != null) {
            event.setFormat(normalize(request.format(), "online"));
        }
        if (request.locationOrLink() != null) {
            event.setLocationOrLink(trimToNull(request.locationOrLink()));
        }
        if (request.maxAttendees() != null) {
            event.setMaxAttendees(request.maxAttendees());
        }
        if (request.thumbnailUrl() != null) {
            event.setThumbnailUrl(trimToNull(request.thumbnailUrl()));
        }
        if (request.topicsCovered() != null) {
            event.setTopicsCovered(trimToNull(request.topicsCovered()));
        }
        if (request.requirements() != null) {
            event.setRequirements(trimToNull(request.requirements()));
        }
        if (request.paid() != null) {
            event.setPaid(request.paid());
            if (!request.paid()) {
                event.setPriceInrCents(0);
            }
        }
        if (request.priceInr() != null && request.priceInr() > 0) {
            event.setPaid(true);
            event.setPriceInrCents(request.priceInr() * 100);
        }

        return responseMapper.toResponse(eventRepository.save(event), mentorId);
    }

    @Transactional
    public CommunityEventResponse cancelHostedEvent(UUID mentorId, UUID eventId) {
        CommunityEvent event = findHostedEvent(mentorId, eventId);
        if (event.isCancelled()) {
            return responseMapper.toResponse(event, mentorId);
        }
        event.setCancelled(true);
        CommunityEvent saved = eventRepository.save(event);

        List<UUID> registrantIds = registrationRepository.findAllByEventIdOrderByRegisteredAtAsc(eventId).stream()
            .map(CommunityEventRegistration::getUserId)
            .filter(userId -> !userId.equals(mentorId))
            .toList();
        notificationService.notifyUsers(
            registrantIds,
            "Event cancelled",
            "\"" + saved.getTitle() + "\" has been cancelled by the host",
            "EVENT_CANCELLED"
        );

        return responseMapper.toResponse(saved, mentorId);
    }

    private MentorHostedEventManageResponse buildManageResponse(CommunityEvent event, UUID mentorId) {
        long totalRegistrations = registrationRepository.countByEventId(event.getId());
        List<EventPayment> payments = paymentRepository.findAllByEventIdOrderByCreatedAtDesc(event.getId());
        int revenueInr = (int) payments.stream()
            .filter(payment -> "completed".equalsIgnoreCase(payment.getStatus()))
            .mapToInt(EventPayment::getAmountCents)
            .sum() / 100;
        int mentorEarningsInr = (int) payments.stream()
            .filter(payment -> "completed".equalsIgnoreCase(payment.getStatus()))
            .mapToInt(EventPayment::getMentorShareCents)
            .sum() / 100;
        return new MentorHostedEventManageResponse(
            responseMapper.toResponse(event, mentorId),
            (int) totalRegistrations,
            revenueInr,
            mentorEarningsInr
        );
    }

    private CommunityEvent findHostedEvent(UUID mentorId, UUID eventId) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!event.getHostId().equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own events");
        }
        return event;
    }

    private MentorEventRegistrationResponse toMentorRegistrationResponse(CommunityEventRegistration registration) {
        UserProfile profile = userProfileRepository.findById(registration.getUserId()).orElse(null);
        return new MentorEventRegistrationResponse(
            registration.getUserId(),
            profile != null ? profile.getUsername() : "user",
            responseMapper.resolveDisplayName(profile),
            registration.getRegisteredAt(),
            registration.getPaymentStatus(),
            registration.getAmountPaidCents() / 100
        );
    }

    private void registerFree(UUID eventId, UUID userId) {
        if (!registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            CommunityEventRegistration registration = new CommunityEventRegistration();
            registration.setEventId(eventId);
            registration.setUserId(userId);
            registration.setPaymentStatus("free");
            registrationRepository.save(registration);
        }
    }

    private CommunityEvent buildBaseEvent(
        UUID hostId,
        String title,
        String description,
        String eventType,
        String category,
        String format,
        String locationOrLink,
        Instant startsAt,
        Instant endsAt,
        Integer maxAttendees,
        Set<String> tags
    ) {
        CommunityEvent event = new CommunityEvent();
        event.setHostId(hostId);
        event.setTitle(title.trim());
        event.setDescription(description.trim());
        event.setEventType(normalize(eventType, "webinar"));
        event.setCategory(normalize(category, "general"));
        event.setFormat(normalize(format, "online"));
        event.setLocationOrLink(trimToNull(locationOrLink));
        event.setStartsAt(startsAt);
        event.setEndsAt(endsAt);
        if (maxAttendees != null) {
            event.setMaxAttendees(maxAttendees);
        }
        if (tags != null) {
            event.setTags(normalizeTags(tags));
        }
        return event;
    }

    private void ensureMentor(String roles) {
        if (roles == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("MENTOR") && !upper.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
    }

    private void validateSchedule(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (!startsAt.isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event start time must be in the future");
        }
    }

    private void ensureProfile(UUID userId, String username) {
        userProfileRepository.findById(userId).orElseGet(() -> {
            UserProfile created = new UserProfile();
            created.setId(userId);
            created.setUsername(username);
            return userProfileRepository.save(created);
        });
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Set<String> normalizeTags(Set<String> tags) {
        return tags.stream()
            .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
