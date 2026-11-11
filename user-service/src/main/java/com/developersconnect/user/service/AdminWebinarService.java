package com.developersconnect.user.service;

import com.developersconnect.user.dto.AdminWebinarResponse;
import com.developersconnect.user.dto.CreateAdminWebinarRequest;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.EventSpeakerResponse;
import com.developersconnect.user.dto.UpdateAdminWebinarRequest;
import com.developersconnect.user.dto.UpdateWebinarStreamRequest;
import com.developersconnect.user.dto.WebinarAnalyticsResponse;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.CommunityEventRegistrationId;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
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
public class AdminWebinarService {

    private static final String WEBINAR = "webinar";
    private static final Set<String> SUBTYPES = Set.of("mentor", "company", "live_coding");
    private static final Set<String> APPROVAL_STATUSES = Set.of("pending", "approved", "rejected");
    private static final Set<String> STREAM_STATUSES = Set.of("scheduled", "live", "ended");

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final UserProfileRepository userProfileRepository;

    public AdminWebinarService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminWebinarResponse> listWebinars(
        String when,
        String status,
        String subtype,
        String hostApproval,
        String streamStatus,
        String q,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        Instant now = Instant.now();
        List<CommunityEvent> events = eventRepository.findAll(
            PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "startsAt"))
        ).getContent();

        String normalizedWhen = normalize(when, "upcoming");
        String normalizedStatus = normalize(status, "active");
        String normalizedSubtype = subtype != null && !subtype.isBlank() && !"all".equalsIgnoreCase(subtype)
            ? normalizeSubtype(subtype) : null;
        String normalizedApproval = hostApproval != null && !hostApproval.isBlank() && !"all".equalsIgnoreCase(hostApproval)
            ? normalizeApproval(hostApproval) : null;
        String normalizedStream = streamStatus != null && !streamStatus.isBlank() && !"all".equalsIgnoreCase(streamStatus)
            ? normalizeStream(streamStatus) : null;
        String query = q != null && !q.isBlank() ? q.trim().toLowerCase(Locale.ROOT) : null;

        return events.stream()
            .filter(this::isWebinar)
            .filter(event -> matchesWhen(event, normalizedWhen, now))
            .filter(event -> matchesStatus(event, normalizedStatus, now))
            .filter(event -> normalizedSubtype == null || normalizedSubtype.equals(event.getWebinarSubtype()))
            .filter(event -> normalizedApproval == null || normalizedApproval.equals(event.getHostApprovalStatus()))
            .filter(event -> normalizedStream == null || normalizedStream.equals(event.getStreamStatus()))
            .filter(event -> query == null
                || event.getTitle().toLowerCase(Locale.ROOT).contains(query)
                || event.getDescription().toLowerCase(Locale.ROOT).contains(query))
            .map(this::toWebinarResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminWebinarResponse getWebinar(UUID webinarId) {
        return toWebinarResponse(findWebinar(webinarId));
    }

    @Transactional(readOnly = true)
    public WebinarAnalyticsResponse getAnalytics() {
        Instant now = Instant.now();
        return new WebinarAnalyticsResponse(
            eventRepository.countByEventTypeAndCancelledFalse(WEBINAR),
            eventRepository.countByEventTypeAndCancelledFalseAndStartsAtAfter(WEBINAR, now),
            eventRepository.countByEventTypeAndStreamStatusAndCancelledFalse(WEBINAR, "live"),
            eventRepository.countByEventTypeAndHostApprovalStatusAndCancelledFalse(WEBINAR, "pending"),
            countWebinarRegistrations(),
            countWebinarAttended(),
            eventRepository.countByEventTypeAndCancelledTrue(WEBINAR)
        );
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationResponse> listAttendance(UUID webinarId) {
        findWebinar(webinarId);
        return registrationRepository.findAllByEventIdOrderByRegisteredAtAsc(webinarId).stream()
            .map(this::toRegistrationResponse)
            .toList();
    }

    @Transactional
    public AdminWebinarResponse createWebinar(CreateAdminWebinarRequest request) {
        validateSchedule(request.startsAt(), request.endsAt());
        UserProfile host = userProfileRepository.findById(request.hostId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Host not found"));

        CommunityEvent event = new CommunityEvent();
        event.setHostId(host.getId());
        event.setEventType(WEBINAR);
        event.setWebinarSubtype(normalizeSubtype(request.webinarSubtype()));
        event.setHostApprovalStatus("approved");
        event.setStreamStatus("scheduled");
        applyWebinarFields(event, request.title(), request.description(), request.category(), request.format(),
            request.streamUrl(), request.startsAt(), request.endsAt(), request.maxAttendees(),
            request.tags(), request.speakerIds());

        CommunityEvent saved = eventRepository.save(event);
        registerIfMissing(saved.getId(), host.getId());
        return toWebinarResponse(saved);
    }

    @Transactional
    public AdminWebinarResponse updateWebinar(UUID webinarId, UpdateAdminWebinarRequest request) {
        CommunityEvent event = findWebinar(webinarId);
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
        if (request.title() != null) event.setTitle(request.title().trim());
        if (request.description() != null) event.setDescription(request.description().trim());
        if (request.webinarSubtype() != null) event.setWebinarSubtype(normalizeSubtype(request.webinarSubtype()));
        if (request.category() != null) event.setCategory(normalize(request.category(), "general"));
        if (request.format() != null) event.setFormat(normalize(request.format(), "online"));
        if (request.streamUrl() != null) event.setLocationOrLink(trimToNull(request.streamUrl()));
        if (request.recordingUrl() != null) event.setRecordingUrl(trimToNull(request.recordingUrl()));
        if (request.maxAttendees() != null) event.setMaxAttendees(request.maxAttendees());
        if (request.tags() != null) event.setTags(normalizeTags(request.tags()));
        if (request.speakerIds() != null) event.setSpeakerIds(normalizeSpeakerIds(request.speakerIds(), event.getHostId()));
        if (request.cancelled() != null) {
            event.setCancelled(request.cancelled());
            if (request.cancelled()) event.setStreamStatus("ended");
        }
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminWebinarResponse approveHost(UUID webinarId) {
        CommunityEvent event = findWebinar(webinarId);
        event.setHostApprovalStatus("approved");
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminWebinarResponse rejectHost(UUID webinarId) {
        CommunityEvent event = findWebinar(webinarId);
        event.setHostApprovalStatus("rejected");
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminWebinarResponse goLive(UUID webinarId) {
        CommunityEvent event = findWebinar(webinarId);
        if (!"approved".equals(event.getHostApprovalStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Host must be approved before going live");
        }
        if (event.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled webinars cannot go live");
        }
        event.setStreamStatus("live");
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminWebinarResponse endStream(UUID webinarId) {
        CommunityEvent event = findWebinar(webinarId);
        event.setStreamStatus("ended");
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public AdminWebinarResponse updateStream(UUID webinarId, UpdateWebinarStreamRequest request) {
        CommunityEvent event = findWebinar(webinarId);
        if (request.streamUrl() != null) event.setLocationOrLink(trimToNull(request.streamUrl()));
        if (request.recordingUrl() != null) event.setRecordingUrl(trimToNull(request.recordingUrl()));
        return toWebinarResponse(eventRepository.save(event));
    }

    @Transactional
    public EventRegistrationResponse checkInAttendee(UUID webinarId, UUID userId) {
        findWebinar(webinarId);
        CommunityEventRegistration registration = registrationRepository
            .findById(new CommunityEventRegistrationId(webinarId, userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registration not found"));
        registration.setAttended(true);
        registration.setAttendedAt(Instant.now());
        return toRegistrationResponse(registrationRepository.save(registration));
    }

    @Transactional
    public AdminWebinarResponse cancelWebinar(UUID webinarId) {
        return updateWebinar(webinarId, new UpdateAdminWebinarRequest(
            null, null, null, null, null, null, null, null, null, null, null, null, null, true
        ));
    }

    @Transactional
    public AdminWebinarResponse restoreWebinar(UUID webinarId) {
        CommunityEvent event = findWebinar(webinarId);
        event.setCancelled(false);
        if ("ended".equals(event.getStreamStatus()) && event.getStartsAt().isAfter(Instant.now())) {
            event.setStreamStatus("scheduled");
        }
        return toWebinarResponse(eventRepository.save(event));
    }

    private CommunityEvent findWebinar(UUID webinarId) {
        CommunityEvent event = eventRepository.findById(webinarId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webinar not found"));
        if (!isWebinar(event)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event is not a webinar");
        }
        return event;
    }

    private boolean isWebinar(CommunityEvent event) {
        return WEBINAR.equalsIgnoreCase(event.getEventType());
    }

    private boolean matchesWhen(CommunityEvent event, String when, Instant now) {
        return switch (when) {
            case "past" -> event.getStartsAt().isBefore(now);
            case "all" -> true;
            default -> !event.getStartsAt().isBefore(now);
        };
    }

    private boolean matchesStatus(CommunityEvent event, String status, Instant now) {
        return switch (status) {
            case "all" -> true;
            case "cancelled" -> event.isCancelled();
            case "pending" -> "pending".equals(event.getHostApprovalStatus()) && !event.isCancelled();
            case "live" -> "live".equals(event.getStreamStatus()) && !event.isCancelled();
            default -> !event.isCancelled();
        };
    }

    private long countWebinarRegistrations() {
        return eventRepository.findAll().stream()
            .filter(this::isWebinar)
            .mapToLong(e -> registrationRepository.countByEventId(e.getId()))
            .sum();
    }

    private long countWebinarAttended() {
        return eventRepository.findAll().stream()
            .filter(this::isWebinar)
            .mapToLong(e -> registrationRepository.countByEventIdAndAttendedTrue(e.getId()))
            .sum();
    }

    private void applyWebinarFields(
        CommunityEvent event, String title, String description, String category, String format,
        String streamUrl, Instant startsAt, Instant endsAt, Integer maxAttendees,
        Set<String> tags, Set<UUID> speakerIds
    ) {
        event.setTitle(title.trim());
        event.setDescription(description.trim());
        event.setCategory(normalize(category, "general"));
        event.setFormat(normalize(format, "online"));
        event.setLocationOrLink(trimToNull(streamUrl));
        event.setStartsAt(startsAt);
        event.setEndsAt(endsAt);
        if (maxAttendees != null) event.setMaxAttendees(maxAttendees);
        if (tags != null) event.setTags(normalizeTags(tags));
        event.setSpeakerIds(normalizeSpeakerIds(speakerIds, event.getHostId()));
    }

    private void registerIfMissing(UUID eventId, UUID userId) {
        if (!registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            CommunityEventRegistration registration = new CommunityEventRegistration();
            registration.setEventId(eventId);
            registration.setUserId(userId);
            registrationRepository.save(registration);
        }
    }

    private AdminWebinarResponse toWebinarResponse(CommunityEvent event) {
        UserProfile host = userProfileRepository.findById(event.getHostId()).orElse(null);
        long registeredCount = registrationRepository.countByEventId(event.getId());
        long attendedCount = registrationRepository.countByEventIdAndAttendedTrue(event.getId());
        return new AdminWebinarResponse(
            event.getId(),
            event.getHostId(),
            resolveDisplayName(host),
            host != null ? host.getRole() : null,
            event.getTitle(),
            event.getDescription(),
            event.getWebinarSubtype() != null ? event.getWebinarSubtype() : "mentor",
            event.getCategory(),
            event.getFormat(),
            event.getLocationOrLink(),
            event.getRecordingUrl(),
            event.getHostApprovalStatus(),
            event.getStreamStatus(),
            event.getStartsAt(),
            event.getEndsAt(),
            event.getMaxAttendees(),
            registeredCount,
            attendedCount,
            registeredCount >= event.getMaxAttendees(),
            event.isCancelled(),
            resolveSpeakers(event),
            Set.copyOf(event.getTags()),
            event.getCreatedAt(),
            event.getUpdatedAt()
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
                speakerId, resolveDisplayName(profile), profile != null ? profile.getRole() : null
            ));
        }
        return speakers;
    }

    private Set<UUID> normalizeSpeakerIds(Set<UUID> speakerIds, UUID hostId) {
        LinkedHashSet<UUID> normalized = new LinkedHashSet<>();
        if (speakerIds != null) {
            for (UUID speakerId : speakerIds) {
                if (speakerId != null && !speakerId.equals(hostId)) {
                    userProfileRepository.findById(speakerId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Speaker not found"));
                    normalized.add(speakerId);
                }
            }
        }
        return normalized;
    }

    private String normalizeSubtype(String subtype) {
        String normalized = normalize(subtype, "mentor");
        if (!SUBTYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webinar subtype");
        }
        return normalized;
    }

    private String normalizeApproval(String status) {
        String normalized = normalize(status, "pending");
        if (!APPROVAL_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid host approval status");
        }
        return normalized;
    }

    private String normalizeStream(String status) {
        String normalized = normalize(status, "scheduled");
        if (!STREAM_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid stream status");
        }
        return normalized;
    }

    private void validateSchedule(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
    }

    private String resolveDisplayName(UserProfile profile) {
        if (profile == null) return "Developer";
        if (profile.getDisplayName() != null) return profile.getDisplayName();
        return profile.getUsername();
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private Set<String> normalizeTags(Set<String> tags) {
        return tags.stream()
            .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
