package com.developersconnect.user.service;

import com.developersconnect.user.dto.CreateMentorWebinarRequest;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.EventSpeakerResponse;
import com.developersconnect.user.dto.MentorWebinarAnalyticsResponse;
import com.developersconnect.user.dto.MentorWebinarResponse;
import com.developersconnect.user.dto.MentorWebinarSummaryResponse;
import com.developersconnect.user.dto.UpdateMentorWebinarStreamRequest;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorWebinarService {

    private static final String WEBINAR = "webinar";
    private static final Set<String> MONETIZATION = Set.of("free", "ticket", "subscription");
    private static final Set<String> STREAM_STATUSES = Set.of("scheduled", "live", "ended");

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final UserProfileRepository userProfileRepository;

    public MentorWebinarService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<MentorWebinarResponse> listMyWebinars(UUID hostId, String when, String streamStatus, int limit) {
        ensureMentor(hostId);
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        Instant now = Instant.now();
        String normalizedWhen = normalize(when, "upcoming");
        String normalizedStream = streamStatus != null && !streamStatus.isBlank() && !"all".equalsIgnoreCase(streamStatus)
            ? normalizeStream(streamStatus) : null;

        return eventRepository
            .findAllByHostIdAndEventTypeOrderByStartsAtDesc(hostId, WEBINAR, PageRequest.of(0, safeLimit))
            .stream()
            .filter(event -> matchesWhen(event, normalizedWhen, now))
            .filter(event -> normalizedStream == null || normalizedStream.equals(event.getStreamStatus()))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorWebinarSummaryResponse getSummary(UUID hostId) {
        ensureMentor(hostId);
        List<CommunityEvent> webinars = eventRepository
            .findAllByHostIdAndEventTypeOrderByStartsAtDesc(hostId, WEBINAR, PageRequest.of(0, 500))
            .stream()
            .filter(event -> !event.isCancelled())
            .toList();

        Instant now = Instant.now();
        long upcoming = webinars.stream()
            .filter(e -> "scheduled".equals(e.getStreamStatus()) && !e.getStartsAt().isBefore(now))
            .count();
        long live = webinars.stream().filter(e -> "live".equals(e.getStreamStatus())).count();
        long completed = webinars.stream()
            .filter(e -> "ended".equals(e.getStreamStatus()) || e.getStartsAt().isBefore(now))
            .count();
        long totalRegistrations = webinars.stream()
            .mapToLong(e -> registrationRepository.countByEventId(e.getId()))
            .sum();
        long totalAttended = webinars.stream()
            .mapToLong(e -> registrationRepository.countByEventIdAndAttendedTrue(e.getId()))
            .sum();
        double averageAttendanceRate = totalRegistrations == 0
            ? 0.0
            : (totalAttended * 100.0) / totalRegistrations;

        return new MentorWebinarSummaryResponse(
            webinars.size(),
            upcoming,
            live,
            completed,
            totalRegistrations,
            totalAttended,
            Math.round(averageAttendanceRate * 10.0) / 10.0
        );
    }

    @Transactional(readOnly = true)
    public MentorWebinarResponse getWebinar(UUID hostId, UUID webinarId) {
        return toResponse(findOwnedWebinar(hostId, webinarId));
    }

    @Transactional(readOnly = true)
    public List<EventRegistrationResponse> listAttendees(UUID hostId, UUID webinarId) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        return registrationRepository.findAllByEventIdOrderByRegisteredAtAsc(event.getId()).stream()
            .map(this::toRegistrationResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorWebinarAnalyticsResponse getAnalytics(UUID hostId, UUID webinarId) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        long registeredCount = registrationRepository.countByEventId(event.getId());
        long attendedCount = registrationRepository.countByEventIdAndAttendedTrue(event.getId());
        long noShowCount = Math.max(0, registeredCount - attendedCount);
        double attendanceRate = registeredCount == 0 ? 0.0 : (attendedCount * 100.0) / registeredCount;
        double capacityUsed = event.getMaxAttendees() == 0
            ? 0.0
            : (registeredCount * 100.0) / event.getMaxAttendees();

        return new MentorWebinarAnalyticsResponse(
            event.getId(),
            event.getTitle(),
            registeredCount,
            attendedCount,
            noShowCount,
            Math.round(attendanceRate * 10.0) / 10.0,
            event.getMaxAttendees(),
            Math.round(capacityUsed * 10.0) / 10.0,
            event.getStreamStatus(),
            resolveMonetization(event),
            event.getStartsAt(),
            event.getEndsAt()
        );
    }

    @Transactional
    public MentorWebinarResponse createWebinar(UUID hostId, String username, CreateMentorWebinarRequest request) {
        ensureMentor(hostId);
        if (!request.endsAt().isAfter(request.startsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (!request.startsAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webinar start time must be in the future");
        }

        ensureProfile(hostId, username);

        CommunityEvent event = new CommunityEvent();
        event.setHostId(hostId);
        event.setTitle(request.title().trim());
        event.setDescription(request.description().trim());
        event.setEventType(WEBINAR);
        event.setCategory(normalize(request.category(), "general"));
        event.setFormat(normalizeMonetization(request.monetization()));
        event.setLocationOrLink(trimToNull(request.streamUrl()));
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());
        event.setMaxAttendees(request.maxAttendees() != null ? request.maxAttendees() : 100);
        event.setWebinarSubtype("mentor");
        event.setHostApprovalStatus("approved");
        event.setStreamStatus("scheduled");
        event.setTags(buildTags(request));
        event.setSpeakerIds(Set.of(hostId));

        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public MentorWebinarResponse goLive(UUID hostId, UUID webinarId) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        if (event.isCancelled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled webinars cannot go live");
        }
        if ("ended".equals(event.getStreamStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Webinar stream has already ended");
        }
        event.setStreamStatus("live");
        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public MentorWebinarResponse endStream(UUID hostId, UUID webinarId) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        event.setStreamStatus("ended");
        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public MentorWebinarResponse updateStream(UUID hostId, UUID webinarId, UpdateMentorWebinarStreamRequest request) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        if (request.streamUrl() != null) {
            event.setLocationOrLink(trimToNull(request.streamUrl()));
        }
        if (request.recordingUrl() != null) {
            event.setRecordingUrl(trimToNull(request.recordingUrl()));
        }
        return toResponse(eventRepository.save(event));
    }

    @Transactional
    public MentorWebinarResponse cancelWebinar(UUID hostId, UUID webinarId) {
        CommunityEvent event = findOwnedWebinar(hostId, webinarId);
        if ("live".equals(event.getStreamStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End the live stream before cancelling");
        }
        event.setCancelled(true);
        return toResponse(eventRepository.save(event));
    }

    private CommunityEvent findOwnedWebinar(UUID hostId, UUID webinarId) {
        ensureMentor(hostId);
        CommunityEvent event = eventRepository.findById(webinarId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webinar not found"));
        if (!WEBINAR.equalsIgnoreCase(event.getEventType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event is not a webinar");
        }
        if (!hostId.equals(event.getHostId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own webinars");
        }
        return event;
    }

    private void ensureMentor(UUID accountId) {
        UserProfile profile = userProfileRepository.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor profile required"));
        String role = profile.getRole() != null ? profile.getRole().toLowerCase(Locale.ROOT) : "";
        if (!role.contains("mentor")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
    }

    private void ensureProfile(UUID accountId, String username) {
        if (!userProfileRepository.existsById(accountId)) {
            UserProfile profile = new UserProfile();
            profile.setId(accountId);
            profile.setUsername(username);
            profile.setDisplayName(username);
            profile.setRole("mentor");
            userProfileRepository.save(profile);
        }
    }

    private Set<String> buildTags(CreateMentorWebinarRequest request) {
        Set<String> tags = new LinkedHashSet<>();
        if (request.tags() != null) {
            tags.addAll(normalizeTags(request.tags()));
        }
        tags.add("webinar");
        tags.add("mentor-hosted");
        tags.add("monetization:" + normalizeMonetization(request.monetization()));
        if (Boolean.TRUE.equals(request.enableChat()) || request.enableChat() == null) {
            tags.add("feature:chat");
        }
        if (Boolean.TRUE.equals(request.enableScreenShare()) || request.enableScreenShare() == null) {
            tags.add("feature:screen-share");
        }
        if (Boolean.TRUE.equals(request.enableQa()) || request.enableQa() == null) {
            tags.add("feature:qa");
        }
        tags.add("feature:analytics");
        return tags;
    }

    private boolean matchesWhen(CommunityEvent event, String when, Instant now) {
        return switch (when) {
            case "past" -> event.getStartsAt().isBefore(now) || "ended".equals(event.getStreamStatus());
            case "live" -> "live".equals(event.getStreamStatus());
            case "all" -> true;
            default -> !event.getStartsAt().isBefore(now) && !"ended".equals(event.getStreamStatus());
        };
    }

    private MentorWebinarResponse toResponse(CommunityEvent event) {
        UserProfile host = userProfileRepository.findById(event.getHostId()).orElse(null);
        long registeredCount = registrationRepository.countByEventId(event.getId());
        long attendedCount = registrationRepository.countByEventIdAndAttendedTrue(event.getId());
        Set<String> tags = event.getTags() != null ? event.getTags() : Set.of();

        return new MentorWebinarResponse(
            event.getId(),
            event.getHostId(),
            resolveDisplayName(host),
            event.getTitle(),
            event.getDescription(),
            event.getCategory(),
            resolveMonetization(event),
            event.getLocationOrLink(),
            event.getRecordingUrl(),
            event.getStreamStatus(),
            event.getStartsAt(),
            event.getEndsAt(),
            event.getMaxAttendees(),
            registeredCount,
            attendedCount,
            registeredCount >= event.getMaxAttendees(),
            event.isCancelled(),
            hasFeature(tags, "chat"),
            hasFeature(tags, "screen-share"),
            hasFeature(tags, "qa"),
            resolveSpeakers(event.getSpeakerIds()),
            tags,
            event.getCreatedAt(),
            event.getUpdatedAt()
        );
    }

    private String resolveMonetization(CommunityEvent event) {
        if (event.getTags() != null) {
            for (String tag : event.getTags()) {
                if (tag.startsWith("monetization:")) {
                    return tag.substring("monetization:".length());
                }
            }
        }
        String format = event.getFormat() != null ? event.getFormat().toLowerCase(Locale.ROOT) : "free";
        if (MONETIZATION.contains(format)) {
            return format;
        }
        return "free";
    }

    private boolean hasFeature(Set<String> tags, String feature) {
        return tags.stream().anyMatch(tag -> tag.equalsIgnoreCase("feature:" + feature));
    }

    private List<EventSpeakerResponse> resolveSpeakers(Set<UUID> speakerIds) {
        if (speakerIds == null || speakerIds.isEmpty()) {
            return List.of();
        }
        List<EventSpeakerResponse> speakers = new ArrayList<>();
        for (UUID speakerId : speakerIds) {
            UserProfile profile = userProfileRepository.findById(speakerId).orElse(null);
            speakers.add(new EventSpeakerResponse(
                speakerId,
                resolveDisplayName(profile),
                profile != null ? profile.getRole() : null
            ));
        }
        return speakers;
    }

    private EventRegistrationResponse toRegistrationResponse(CommunityEventRegistration registration) {
        UserProfile profile = userProfileRepository.findById(registration.getUserId()).orElse(null);
        return new EventRegistrationResponse(
            registration.getUserId(),
            profile != null ? profile.getUsername() : "unknown",
            resolveDisplayName(profile),
            registration.getRegisteredAt(),
            registration.isAttended(),
            registration.getAttendedAt()
        );
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

    private String normalizeMonetization(String value) {
        String normalized = normalize(value, "free");
        if (!MONETIZATION.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Monetization must be free, ticket, or subscription");
        }
        return normalized;
    }

    private String normalizeStream(String value) {
        String normalized = normalize(value, "scheduled");
        if (!STREAM_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid stream status");
        }
        return normalized;
    }

    private Set<String> normalizeTags(Set<String> tags) {
        return tags.stream()
            .filter(tag -> tag != null && !tag.isBlank())
            .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
