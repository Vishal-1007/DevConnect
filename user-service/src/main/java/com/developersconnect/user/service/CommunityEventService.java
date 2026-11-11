package com.developersconnect.user.service;

import java.time.Instant;
import java.util.Comparator;
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
import com.developersconnect.user.dto.CreateCommunityEventRequest;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
import com.developersconnect.user.repository.UserProfileRepository;

@Service
public class CommunityEventService {

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final UserProfileRepository userProfileRepository;
    private final EventCommerceService commerceService;
    private final EventNotificationService notificationService;
    private final EventResponseMapper responseMapper;

    public CommunityEventService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        UserProfileRepository userProfileRepository,
        EventCommerceService commerceService,
        EventNotificationService notificationService,
        EventResponseMapper responseMapper
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userProfileRepository = userProfileRepository;
        this.commerceService = commerceService;
        this.notificationService = notificationService;
        this.responseMapper = responseMapper;
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> listEvents(
        UUID viewerId,
        String when,
        String category,
        String eventType,
        String query,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        PageRequest page = PageRequest.of(0, safeLimit);
        Instant now = Instant.now();
        String normalizedWhen = normalize(when, "upcoming");

        List<CommunityEvent> events;
        if (query != null && !query.isBlank() && "upcoming".equals(normalizedWhen)) {
            events = eventRepository.searchUpcoming(query.trim(), now, page);
        } else if ("past".equals(normalizedWhen)) {
            events = eventRepository.findAllByStartsAtBeforeOrderByStartsAtDesc(now, page);
        } else if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            events = eventRepository.findAllByCategoryAndStartsAtAfterOrderByStartsAtAsc(
                normalize(category, "general"), now, page
            );
        } else if (eventType != null && !eventType.isBlank() && !"all".equalsIgnoreCase(eventType)) {
            events = eventRepository.findAllByEventTypeAndStartsAtAfterOrderByStartsAtAsc(
                normalize(eventType, "webinar"), now, page
            );
        } else {
            events = eventRepository.findAllByStartsAtAfterOrderByStartsAtAsc(now, page);
        }

        return events.stream()
            .filter(event -> !event.isCancelled())
            .filter(this::isPubliclyVisible)
            .sorted(Comparator.comparing(CommunityEvent::isFeatured).reversed()
                .thenComparing(CommunityEvent::getStartsAt))
            .map(event -> responseMapper.toResponse(event, viewerId))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> listMyRegistrations(UUID viewerId) {
        return registrationRepository.findAll().stream()
            .filter(reg -> reg.getUserId().equals(viewerId))
            .map(reg -> eventRepository.findById(reg.getEventId()).orElse(null))
            .filter(event -> event != null && !event.isCancelled())
            .sorted(Comparator.comparing(CommunityEvent::getStartsAt))
            .map(event -> responseMapper.toResponse(event, viewerId))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> listBookmarkedEvents(UUID viewerId) {
        return commerceService.listBookmarkedEvents(viewerId).stream()
            .map(event -> responseMapper.toResponse(event, viewerId))
            .toList();
    }

    @Transactional(readOnly = true)
    public CommunityEventResponse getEvent(UUID eventId, UUID viewerId) {
        return responseMapper.toResponse(findEvent(eventId, viewerId), viewerId);
    }

    @Transactional
    public CommunityEventResponse createEvent(
        UUID hostId,
        String username,
        CreateCommunityEventRequest request
    ) {
        validateSchedule(request.startsAt(), request.endsAt());
        ensureProfile(hostId, username);

        CommunityEvent event = buildBaseEvent(hostId, request.title(), request.description(),
            request.eventType(), request.category(), request.format(), request.locationOrLink(),
            request.startsAt(), request.endsAt(), request.maxAttendees(), request.tags());
        event.setHostApprovalStatus("approved");

        CommunityEvent saved = eventRepository.save(event);
        registerFree(saved.getId(), hostId);
        return responseMapper.toResponse(saved, hostId);
    }

    @Transactional
    public CommunityEventResponse register(UUID eventId, UUID userId) {
        CommunityEvent event = findEvent(eventId, userId);
        if (event.isPaid()) {
            throw new ResponseStatusException(
                HttpStatus.PAYMENT_REQUIRED,
                "This is a premium event. Complete payment to register."
            );
        }
        if (event.getEndsAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event has already ended");
        }
        long count = registrationRepository.countByEventId(eventId);
        if (count >= event.getMaxAttendees()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Event is full");
        }
        if (registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "You are already registered for this event"
            );
        }
        registerFree(eventId, userId);
        notificationService.notifyUser(
            userId,
            "Registration confirmed",
            "You successfully registered for " + event.getTitle(),
            "EVENT_REGISTRATION"
        );
        notificationService.notifyUser(
            event.getHostId(),
            "New registration",
            responseMapper.resolveDisplayName(userProfileRepository.findById(userId).orElse(null))
                + " registered for your event",
            "EVENT_REGISTRATION"
        );
        return responseMapper.toResponse(event, userId);
    }

    @Transactional
    public CommunityEventResponse unregister(UUID eventId, UUID userId) {
        CommunityEvent event = findEvent(eventId, userId);
        registrationRepository.deleteByEventIdAndUserId(eventId, userId);
        return responseMapper.toResponse(event, userId);
    }

    @Transactional
    public CommunityEventResponse approveEvent(UUID eventId) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        event.setHostApprovalStatus("approved");
        eventRepository.save(event);
        notificationService.notifyUser(
            event.getHostId(),
            "Event approved",
            "Your event \"" + event.getTitle() + "\" is now live",
            "EVENT_APPROVED"
        );
        return responseMapper.toResponse(event, event.getHostId());
    }

    @Transactional
    public CommunityEventResponse rejectEvent(UUID eventId, String note) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        event.setHostApprovalStatus("rejected");
        eventRepository.save(event);
        notificationService.notifyUser(
            event.getHostId(),
            "Event rejected",
            note != null && !note.isBlank() ? note : "Your event was not approved",
            "EVENT_REJECTED"
        );
        return responseMapper.toResponse(event, event.getHostId());
    }

    @Transactional
    public CommunityEventResponse setFeatured(UUID eventId, boolean featured) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        event.setFeatured(featured);
        eventRepository.save(event);
        return responseMapper.toResponse(event, event.getHostId());
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

    private CommunityEvent findEvent(UUID eventId, UUID viewerId) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (event.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        if (!isPubliclyVisible(event) && !event.getHostId().equals(viewerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return event;
    }

    private boolean isPubliclyVisible(CommunityEvent event) {
        return "approved".equalsIgnoreCase(event.getHostApprovalStatus());
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
