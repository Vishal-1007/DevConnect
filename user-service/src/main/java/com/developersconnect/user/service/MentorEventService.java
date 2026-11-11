package com.developersconnect.user.service;

import com.developersconnect.user.dto.ApplyMentorEventRoleRequest;
import com.developersconnect.user.dto.EventSpeakerResponse;
import com.developersconnect.user.dto.MentorEventResponse;
import com.developersconnect.user.dto.MentorEventRoleResponse;
import com.developersconnect.user.dto.MentorEventSummaryResponse;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRole;
import com.developersconnect.user.model.CommunityEventRole.EventRoleId;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
import com.developersconnect.user.repository.CommunityEventRoleRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorEventService {

    private static final Set<String> ROLES = Set.of("speaker", "judge", "interviewer", "organizer");

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final CommunityEventRoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;

    public MentorEventService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        CommunityEventRoleRepository roleRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.roleRepository = roleRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<MentorEventResponse> listEvents(
        UUID mentorId,
        String roles,
        String when,
        String type,
        String q,
        boolean mineOnly,
        int limit
    ) {
        ensureMentor(mentorId, roles);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        Instant now = Instant.now();
        String normalizedWhen = normalize(when, "upcoming");
        String normalizedType = type != null && !type.isBlank() && !"all".equalsIgnoreCase(type)
            ? normalize(type, "all") : null;
        String query = q != null && !q.isBlank() ? q.trim().toLowerCase(Locale.ROOT) : null;

        List<CommunityEvent> events = eventRepository
            .findAllByStartsAtAfterOrderByStartsAtAsc(now, PageRequest.of(0, safeLimit * 3))
            .stream()
            .filter(event -> !event.isCancelled())
            .filter(event -> isPubliclyVisible(event))
            .filter(event -> matchesWhen(event, normalizedWhen, now))
            .filter(event -> normalizedType == null || normalizedType.equalsIgnoreCase(event.getEventType()))
            .filter(event -> query == null || matchesQuery(event, query))
            .limit(safeLimit)
            .toList();

        if ("past".equals(normalizedWhen)) {
            events = eventRepository
                .findAllByStartsAtBeforeOrderByStartsAtDesc(now, PageRequest.of(0, safeLimit * 3))
                .stream()
                .filter(event -> !event.isCancelled())
                .filter(event -> isPubliclyVisible(event))
                .filter(event -> normalizedType == null || normalizedType.equalsIgnoreCase(event.getEventType()))
                .filter(event -> query == null || matchesQuery(event, query))
                .limit(safeLimit)
                .toList();
        }

        if (mineOnly) {
            Set<UUID> myEventIds = roleRepository.findAllByUserIdOrderByAppliedAtDesc(mentorId).stream()
                .map(CommunityEventRole::getEventId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
            events = events.stream().filter(event -> myEventIds.contains(event.getId())).toList();
        }

        return events.stream().map(event -> toResponse(event, mentorId)).toList();
    }

    @Transactional(readOnly = true)
    public MentorEventSummaryResponse getSummary(UUID mentorId, String roles) {
        ensureMentor(mentorId, roles);
        Instant now = Instant.now();
        List<CommunityEvent> upcoming = eventRepository
            .findAllByStartsAtAfterOrderByStartsAtAsc(now, PageRequest.of(0, 200))
            .stream()
            .filter(event -> !event.isCancelled())
            .filter(this::isPubliclyVisible)
            .toList();

        long hackathons = upcoming.stream().filter(e -> "hackathon".equalsIgnoreCase(e.getEventType())).count();
        long workshops = upcoming.stream()
            .filter(e -> "workshop".equalsIgnoreCase(e.getEventType()) || "webinar".equalsIgnoreCase(e.getEventType()))
            .count();
        long networking = upcoming.stream()
            .filter(e -> "meetup".equalsIgnoreCase(e.getEventType()) || "networking".equalsIgnoreCase(e.getEventType()))
            .count();
        long participations = roleRepository.countByUserId(mentorId);
        long approvedRoles = roleRepository.countByUserIdAndStatus(mentorId, "approved");

        return new MentorEventSummaryResponse(
            upcoming.size(),
            hackathons,
            workshops,
            networking,
            participations,
            approvedRoles
        );
    }

    @Transactional(readOnly = true)
    public MentorEventResponse getEvent(UUID mentorId, String roles, UUID eventId) {
        ensureMentor(mentorId, roles);
        CommunityEvent event = findVisibleEvent(eventId);
        return toResponse(event, mentorId);
    }

    @Transactional
    public MentorEventResponse applyForRole(UUID mentorId, String roles, UUID eventId, ApplyMentorEventRoleRequest request) {
        ensureMentor(mentorId, roles);
        CommunityEvent event = findVisibleEvent(eventId);
        if (event.getStartsAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot apply for roles on past events");
        }

        String role = normalizeRole(request.role());
        if (!openRolesFor(event).contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is not available for this event type");
        }
        if (roleRepository.existsByEventIdAndUserIdAndRole(eventId, mentorId, role)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already applied for this role");
        }

        CommunityEventRole application = new CommunityEventRole();
        application.setEventId(eventId);
        application.setUserId(mentorId);
        application.setRole(role);
        application.setStatus("approved");
        roleRepository.save(application);

        if ("speaker".equals(role) && !event.getSpeakerIds().contains(mentorId)) {
            Set<UUID> speakers = new LinkedHashSet<>(event.getSpeakerIds());
            speakers.add(mentorId);
            event.setSpeakerIds(speakers);
            eventRepository.save(event);
        }

        return toResponse(event, mentorId);
    }

    @Transactional
    public MentorEventResponse withdrawRole(UUID mentorId, String roles, UUID eventId, String role) {
        ensureMentor(mentorId, roles);
        CommunityEvent event = findVisibleEvent(eventId);
        if (event.getStartsAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot withdraw from past events");
        }

        String normalizedRole = normalizeRole(role);
        CommunityEventRole application = roleRepository.findById(new EventRoleId(eventId, mentorId, normalizedRole))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role application not found"));
        roleRepository.delete(application);

        if ("speaker".equals(normalizedRole)) {
            Set<UUID> speakers = new LinkedHashSet<>(event.getSpeakerIds());
            speakers.remove(mentorId);
            event.setSpeakerIds(speakers);
            eventRepository.save(event);
        }

        return toResponse(event, mentorId);
    }

    private CommunityEvent findVisibleEvent(UUID eventId) {
        CommunityEvent event = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (event.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        if (!isPubliclyVisible(event)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return event;
    }

    private boolean isPubliclyVisible(CommunityEvent event) {
        if (!"webinar".equalsIgnoreCase(event.getEventType())) {
            return true;
        }
        return "approved".equalsIgnoreCase(event.getHostApprovalStatus());
    }

    private boolean matchesWhen(CommunityEvent event, String when, Instant now) {
        return switch (when) {
            case "past" -> event.getStartsAt().isBefore(now);
            case "all" -> true;
            default -> !event.getStartsAt().isBefore(now);
        };
    }

    private boolean matchesQuery(CommunityEvent event, String query) {
        return event.getTitle().toLowerCase(Locale.ROOT).contains(query)
            || event.getDescription().toLowerCase(Locale.ROOT).contains(query)
            || event.getCategory().toLowerCase(Locale.ROOT).contains(query)
            || event.getEventType().toLowerCase(Locale.ROOT).contains(query);
    }

    private List<String> openRolesFor(CommunityEvent event) {
        return switch (normalize(event.getEventType(), "event")) {
            case "hackathon" -> List.of("judge", "organizer", "interviewer", "speaker");
            case "webinar", "workshop" -> List.of("speaker", "organizer", "interviewer");
            case "meetup", "networking" -> List.of("speaker", "organizer");
            case "contest", "coding-contest" -> List.of("judge", "interviewer", "organizer");
            default -> List.of("speaker", "judge", "interviewer", "organizer");
        };
    }

    private MentorEventResponse toResponse(CommunityEvent event, UUID mentorId) {
        UserProfile host = userProfileRepository.findById(event.getHostId()).orElse(null);
        long attendeeCount = registrationRepository.countByEventId(event.getId());
        boolean registered = registrationRepository.existsByEventIdAndUserId(event.getId(), mentorId);
        List<MentorEventRoleResponse> myRoles = roleRepository.findAllByEventIdAndUserId(event.getId(), mentorId).stream()
            .map(role -> new MentorEventRoleResponse(role.getRole(), role.getStatus(), role.getAppliedAt()))
            .toList();

        return new MentorEventResponse(
            event.getId(),
            event.getHostId(),
            resolveDisplayName(host),
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
            registered,
            attendeeCount >= event.getMaxAttendees(),
            event.getTags() != null ? Set.copyOf(event.getTags()) : Set.of(),
            resolveSpeakers(event),
            openRolesFor(event),
            myRoles
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

    private void ensureMentor(UUID accountId, String jwtRoles) {
        UserProfile profile = userProfileRepository.findById(accountId).orElse(null);
        String profileRole = profile != null && profile.getRole() != null
            ? profile.getRole().toLowerCase(Locale.ROOT) : "";
        String tokenRoles = jwtRoles != null ? jwtRoles.toLowerCase(Locale.ROOT) : "";
        if (profileRole.contains("mentor") || tokenRoles.contains("mentor")) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
    }

    private String normalizeRole(String role) {
        String normalized = normalize(role, "");
        if (!ROLES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be speaker, judge, interviewer, or organizer");
        }
        return normalized;
    }

    private String resolveDisplayName(UserProfile profile) {
        if (profile == null) {
            return "Unknown";
        }
        if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
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
}
