package com.developersconnect.user.service;

import com.developersconnect.user.dto.AdminCommunityEventResponse;
import com.developersconnect.user.dto.CreateAdminCommunityEventRequest;
import com.developersconnect.user.dto.EventAnalyticsResponse;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.EventSpeakerResponse;
import com.developersconnect.user.dto.UpdateAdminCommunityEventRequest;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.model.EventPayment;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
import com.developersconnect.user.repository.EventPaymentRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminCommunityEventService {

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final UserProfileRepository userProfileRepository;
    private final EventPaymentRepository paymentRepository;

    public AdminCommunityEventService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        UserProfileRepository userProfileRepository,
        EventPaymentRepository paymentRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userProfileRepository = userProfileRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminCommunityEventResponse> listEvents(
        String when,
        String category,
        String eventType,
        String q,
        String status,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        PageRequest page = PageRequest.of(0, safeLimit);
        Instant now = Instant.now();
        String normalizedWhen = normalize(when, "upcoming");
        String normalizedStatus = normalize(status, "active");

        List<CommunityEvent> events;
        if ("cancelled".equals(normalizedStatus) || "all".equals(normalizedStatus)) {
            events = eventRepository.findAll(
                PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "startsAt"))
            ).getContent();
        } else if (q != null && !q.isBlank() && "upcoming".equals(normalizedWhen)) {
            events = eventRepository.searchUpcoming(q.trim(), now, page);
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
            .filter(event -> matchesStatus(event, normalizedStatus, now))
            .map(this::toAdminResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminCommunityEventResponse getEvent(UUID eventId) {
        return toAdminResponse(findEvent(eventId));
    }

    @Transactional(readOnly = true)
    public EventAnalyticsResponse getAnalytics() {
        Instant now = Instant.now();
        return new EventAnalyticsResponse(
            eventRepository.count(),
            eventRepository.countByCancelledFalseAndStartsAtAfter(now),
            eventRepository.countByCancelledFalseAndStartsAtBefore(now),
            eventRepository.countByCancelledTrue(),
            registrationRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationResponse> listRegistrations(UUID eventId) {
        findEvent(eventId);
        return registrationRepository.findAllByEventIdOrderByRegisteredAtAsc(eventId).stream()
            .map(this::toRegistrationResponse)
            .toList();
    }

    @Transactional
    public AdminCommunityEventResponse createEvent(CreateAdminCommunityEventRequest request) {
        validateSchedule(request.startsAt(), request.endsAt());

        UserProfile host = userProfileRepository.findById(request.hostId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Host not found"));

        CommunityEvent event = new CommunityEvent();
        event.setHostId(host.getId());
        applyEventFields(
            event,
            request.title(),
            request.description(),
            request.eventType(),
            request.category(),
            request.format(),
            request.locationOrLink(),
            request.startsAt(),
            request.endsAt(),
            request.maxAttendees(),
            request.tags(),
            request.speakerIds()
        );

        CommunityEvent saved = eventRepository.save(event);
        registerIfMissing(saved.getId(), host.getId());
        return toAdminResponse(saved);
    }

    @Transactional
    public AdminCommunityEventResponse updateEvent(UUID eventId, UpdateAdminCommunityEventRequest request) {
        CommunityEvent event = findEvent(eventId);

        if (request.hostId() != null) {
            userProfileRepository.findById(request.hostId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Host not found"));
            event.setHostId(request.hostId());
        }
        if (request.startsAt() != null || request.endsAt() != null) {
            Instant startsAt = request.startsAt() != null ? request.startsAt() : event.getStartsAt();
            Instant endsAt = request.endsAt() != null ? request.endsAt() : event.getEndsAt();
            validateSchedule(startsAt, endsAt);
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
        if (request.tags() != null) {
            event.setTags(normalizeTags(request.tags()));
        }
        if (request.speakerIds() != null) {
            event.setSpeakerIds(normalizeSpeakerIds(request.speakerIds(), event.getHostId()));
        }
        if (request.cancelled() != null) {
            event.setCancelled(request.cancelled());
        }

        return toAdminResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminCommunityEventResponse cancelEvent(UUID eventId) {
        return updateEvent(eventId, new UpdateAdminCommunityEventRequest(
            null, null, null, null, null, null, null, null, null, null, null, null, true
        ));
    }

    @Transactional
    public AdminCommunityEventResponse restoreEvent(UUID eventId) {
        return updateEvent(eventId, new UpdateAdminCommunityEventRequest(
            null, null, null, null, null, null, null, null, null, null, null, null, false
        ));
    }

    private CommunityEvent findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private boolean matchesStatus(CommunityEvent event, String status, Instant now) {
        return switch (status) {
            case "all" -> true;
            case "cancelled" -> event.isCancelled();
            case "past" -> !event.isCancelled() && event.getStartsAt().isBefore(now);
            case "upcoming" -> !event.isCancelled() && !event.getStartsAt().isBefore(now);
            default -> !event.isCancelled();
        };
    }

    private void validateSchedule(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
    }

    private void applyEventFields(
        CommunityEvent event,
        String title,
        String description,
        String eventType,
        String category,
        String format,
        String locationOrLink,
        Instant startsAt,
        Instant endsAt,
        Integer maxAttendees,
        Set<String> tags,
        Set<UUID> speakerIds
    ) {
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
        event.setSpeakerIds(normalizeSpeakerIds(speakerIds, event.getHostId()));
    }

    private Set<UUID> normalizeSpeakerIds(Set<UUID> speakerIds, UUID hostId) {
        LinkedHashSet<UUID> normalized = new LinkedHashSet<>();
        if (speakerIds != null) {
            for (UUID speakerId : speakerIds) {
                if (speakerId != null && !speakerId.equals(hostId)) {
                    userProfileRepository.findById(speakerId)
                        .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Speaker not found: " + speakerId
                        ));
                    normalized.add(speakerId);
                }
            }
        }
        return normalized;
    }

    private void registerIfMissing(UUID eventId, UUID userId) {
        if (!registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            CommunityEventRegistration registration = new CommunityEventRegistration();
            registration.setEventId(eventId);
            registration.setUserId(userId);
            registrationRepository.save(registration);
        }
    }

    private AdminCommunityEventResponse toAdminResponse(CommunityEvent event) {
        UserProfile host = userProfileRepository.findById(event.getHostId()).orElse(null);
        long attendeeCount = registrationRepository.countByEventId(event.getId());
        List<EventPayment> payments = paymentRepository.findAllByEventIdOrderByCreatedAtDesc(event.getId());
        long revenueCents = payments.stream()
            .filter(payment -> "completed".equalsIgnoreCase(payment.getStatus()))
            .mapToInt(EventPayment::getAmountCents)
            .sum();
        long mentorShareCents = payments.stream()
            .filter(payment -> "completed".equalsIgnoreCase(payment.getStatus()))
            .mapToInt(EventPayment::getMentorShareCents)
            .sum();
        return new AdminCommunityEventResponse(
            event.getId(),
            event.getHostId(),
            resolveDisplayName(host),
            host != null ? host.getRole() : null,
            event.getTitle(),
            event.getDescription(),
            event.getEventType(),
            event.getCategory(),
            event.getFormat(),
            event.getLocationOrLink(),
            event.getStartsAt(),
            event.getEndsAt(),
            event.getMaxAttendees(),
            attendeeCount,
            attendeeCount >= event.getMaxAttendees(),
            event.isCancelled(),
            resolveSpeakers(event),
            Set.copyOf(event.getTags()),
            event.getCreatedAt(),
            event.getUpdatedAt(),
            event.getThumbnailUrl(),
            event.isPaid(),
            event.getPriceInrCents() / 100,
            event.isFeatured(),
            event.getHostApprovalStatus(),
            revenueCents / 100,
            mentorShareCents / 100
        );
    }

    private EventRegistrationResponse toRegistrationResponse(CommunityEventRegistration registration) {
        UserProfile profile = userProfileRepository.findById(registration.getUserId()).orElse(null);
        return new EventRegistrationResponse(
            registration.getUserId(),
            profile != null ? profile.getUsername() : "user",
            resolveDisplayName(profile),
            registration.getRegisteredAt(),
            registration.isAttended(),
            registration.getAttendedAt()
        );
    }

    private List<EventSpeakerResponse> resolveSpeakers(CommunityEvent event) {
        List<EventSpeakerResponse> speakers = new ArrayList<>();
        for (UUID speakerId : event.getSpeakerIds()) {
            UserProfile profile = userProfileRepository.findById(speakerId).orElse(null);
            speakers.add(new EventSpeakerResponse(
                speakerId,
                resolveDisplayName(profile),
                profile != null ? profile.getRole() : null
            ));
        }
        return speakers;
    }

    private String resolveDisplayName(UserProfile profile) {
        if (profile == null) {
            return "Developer";
        }
        if (profile.getDisplayName() != null) {
            return profile.getDisplayName();
        }
        return profile.getUsername();
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
