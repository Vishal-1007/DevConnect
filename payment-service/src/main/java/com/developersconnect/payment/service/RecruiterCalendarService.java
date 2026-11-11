package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.InterviewCalendarEventRequest;
import com.developersconnect.payment.dto.InterviewCalendarEventResponse;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecruiterCalendarService {

    private final RecruiterIntegrationRepository repository;
    private final GoogleOAuthService googleOAuthService;
    private final GoogleCalendarApiClient calendarApiClient;
    private final ObjectMapper objectMapper;
    private final ZoomMeetingService zoomMeetingService;
    private final TeamsMeetingService teamsMeetingService;

    public RecruiterCalendarService(
        RecruiterIntegrationRepository repository,
        GoogleOAuthService googleOAuthService,
        GoogleCalendarApiClient calendarApiClient,
        ObjectMapper objectMapper,
        ZoomMeetingService zoomMeetingService,
        TeamsMeetingService teamsMeetingService
    ) {
        this.repository = repository;
        this.googleOAuthService = googleOAuthService;
        this.calendarApiClient = calendarApiClient;
        this.objectMapper = objectMapper;
        this.zoomMeetingService = zoomMeetingService;
        this.teamsMeetingService = teamsMeetingService;
    }

    @Transactional(readOnly = true)
    public void testGoogleCalendarConnection(UUID recruiterId) {
        RecruiterIntegration integration = requireGoogleIntegration(recruiterId);
        RecruiterIntegration refreshed = googleOAuthService.refreshAccessTokenIfNeeded(integration);
        calendarApiClient.testConnection(refreshed.getAccessToken());
    }

    @Transactional
    public InterviewCalendarEventResponse createInterviewEvent(
        UUID recruiterId,
        InterviewCalendarEventRequest request
    ) {
        Map<String, Object> settings = readGoogleSettings(recruiterId);
        if (!Boolean.TRUE.equals(settings.get("autoCreateEvents"))) {
            return new InterviewCalendarEventResponse(
                null,
                resolveMeetingLink(recruiterId, settings, request),
                false,
                false,
                "Auto-create calendar events is disabled in sync settings"
            );
        }

        RecruiterIntegration integration = googleOAuthService.refreshAccessTokenIfNeeded(
            requireGoogleIntegration(recruiterId)
        );
        boolean sendInvites = Boolean.TRUE.equals(settings.get("sendCandidateInvite"));
        String meetingLink = resolveMeetingLink(recruiterId, settings, request);

        GoogleCalendarApiClient.CalendarEventPayload payload = buildPayload(
            request,
            settings,
            meetingLink
        );

        GoogleCalendarApiClient.CalendarEventResult result = calendarApiClient.createEvent(
            integration.getAccessToken(),
            payload,
            sendInvites
        );

        integration.setLastSyncAt(Instant.now());
        repository.save(integration);

        return new InterviewCalendarEventResponse(
            result.eventId(),
            result.meetingLink() != null ? result.meetingLink() : meetingLink,
            true,
            sendInvites && request.candidateEmail() != null && !request.candidateEmail().isBlank(),
            "Google Calendar event created successfully"
        );
    }

    @Transactional
    public InterviewCalendarEventResponse updateInterviewEvent(
        UUID recruiterId,
        String googleEventId,
        InterviewCalendarEventRequest request
    ) {
        Map<String, Object> settings = readGoogleSettings(recruiterId);
        if (!Boolean.TRUE.equals(settings.get("syncUpdates"))) {
            return new InterviewCalendarEventResponse(
                googleEventId,
                request.meetingLink(),
                false,
                false,
                "Sync interview updates is disabled in sync settings"
            );
        }

        RecruiterIntegration integration = googleOAuthService.refreshAccessTokenIfNeeded(
            requireGoogleIntegration(recruiterId)
        );
        boolean sendInvites = Boolean.TRUE.equals(settings.get("sendCandidateInvite"));
        String meetingLink = resolveMeetingLink(recruiterId, settings, request);

        GoogleCalendarApiClient.CalendarEventPayload payload = buildPayload(
            request,
            settings,
            meetingLink
        );

        GoogleCalendarApiClient.CalendarEventResult result = calendarApiClient.updateEvent(
            integration.getAccessToken(),
            googleEventId,
            payload,
            sendInvites
        );

        integration.setLastSyncAt(Instant.now());
        repository.save(integration);

        return new InterviewCalendarEventResponse(
            result.eventId() != null ? result.eventId() : googleEventId,
            result.meetingLink() != null ? result.meetingLink() : meetingLink,
            true,
            sendInvites && request.candidateEmail() != null && !request.candidateEmail().isBlank(),
            "Google Calendar event updated successfully"
        );
    }

    @Transactional
    public InterviewCalendarEventResponse deleteInterviewEvent(UUID recruiterId, String googleEventId) {
        Map<String, Object> settings = readGoogleSettings(recruiterId);
        if (!Boolean.TRUE.equals(settings.get("removeCancelledEvents"))) {
            return new InterviewCalendarEventResponse(
                googleEventId,
                null,
                false,
                false,
                "Remove cancelled events is disabled in sync settings"
            );
        }

        RecruiterIntegration integration = googleOAuthService.refreshAccessTokenIfNeeded(
            requireGoogleIntegration(recruiterId)
        );
        calendarApiClient.deleteEvent(integration.getAccessToken(), googleEventId);

        integration.setLastSyncAt(Instant.now());
        repository.save(integration);

        return new InterviewCalendarEventResponse(
            googleEventId,
            null,
            true,
            false,
            "Google Calendar event deleted successfully"
        );
    }

    private GoogleCalendarApiClient.CalendarEventPayload buildPayload(
        InterviewCalendarEventRequest request,
        Map<String, Object> settings,
        String meetingLink
    ) {
        Instant start = request.scheduledAt();
        Instant end = start.plusSeconds(request.durationMinutes() * 60L);
        int reminderMinutes = reminderMinutesFromSetting(String.valueOf(settings.get("reminderTime")));

        StringBuilder description = new StringBuilder();
        description.append("Candidate: ").append(request.candidateName()).append('\n');
        description.append("Job Role: ").append(request.jobTitle()).append('\n');
        if (request.company() != null && !request.company().isBlank()) {
            description.append("Company: ").append(request.company()).append('\n');
        }
        if (request.interviewType() != null && !request.interviewType().isBlank()) {
            description.append("Interview Type: ").append(request.interviewType()).append('\n');
        }
        if (request.notes() != null && !request.notes().isBlank()) {
            description.append("Notes: ").append(request.notes()).append('\n');
        }
        if (meetingLink != null && !meetingLink.isBlank()) {
            description.append("Meeting Link: ").append(meetingLink);
        }

        List<GoogleCalendarApiClient.CalendarAttendee> attendees = new ArrayList<>();
        if (request.recruiterEmail() != null && !request.recruiterEmail().isBlank()) {
            attendees.add(new GoogleCalendarApiClient.CalendarAttendee(request.recruiterEmail()));
        }
        if (request.candidateEmail() != null && !request.candidateEmail().isBlank()) {
            attendees.add(new GoogleCalendarApiClient.CalendarAttendee(request.candidateEmail()));
        }

        return new GoogleCalendarApiClient.CalendarEventPayload(
            "Interview - " + request.candidateName(),
            description.toString().trim(),
            meetingLink,
            start,
            end,
            reminderMinutes,
            attendees
        );
    }

    private String resolveMeetingLink(
        UUID recruiterId,
        Map<String, Object> settings,
        InterviewCalendarEventRequest request
    ) {
        if (request.meetingLink() != null && !request.meetingLink().isBlank()) {
            return request.meetingLink();
        }
        if (!Boolean.TRUE.equals(settings.get("attachMeetingLinks"))) {
            return null;
        }

        String topic = "Interview - " + request.candidateName();
        Instant start = request.scheduledAt();
        Instant end = start.plusSeconds(request.durationMinutes() * 60L);

        String zoomLink = zoomMeetingService.createMeetingLink(
            recruiterId,
            topic,
            start,
            request.durationMinutes()
        );
        if (zoomLink != null && !zoomLink.isBlank()) {
            return zoomLink;
        }

        String teamsLink = teamsMeetingService.createMeetingLink(recruiterId, topic, start, end);
        if (teamsLink != null && !teamsLink.isBlank()) {
            return teamsLink;
        }

        return null;
    }

    private int reminderMinutesFromSetting(String reminderTime) {
        return switch (reminderTime) {
            case "10_MINUTES" -> 10;
            case "1_HOUR" -> 60;
            case "1_DAY" -> 24 * 60;
            default -> 30;
        };
    }

    private RecruiterIntegration requireGoogleIntegration(UUID recruiterId) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, RecruiterIntegrationProvider.GOOGLE_CALENDAR)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Google Calendar is not connected"));

        if (!integration.isConnected() || integration.getAccessToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google Calendar is not connected");
        }
        return integration;
    }

    private Map<String, Object> readGoogleSettings(UUID recruiterId) {
        RecruiterIntegration integration = requireGoogleIntegration(recruiterId);
        if (integration.getSyncSettingsJson() == null || integration.getSyncSettingsJson().isBlank()) {
            return defaultGoogleSettings();
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(
                integration.getSyncSettingsJson(),
                new TypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> merged = defaultGoogleSettings();
            merged.putAll(parsed);
            return merged;
        } catch (Exception ex) {
            return defaultGoogleSettings();
        }
    }

  private Map<String, Object> defaultGoogleSettings() {
        Map<String, Object> settings = new java.util.LinkedHashMap<>();
        settings.put("autoCreateEvents", true);
        settings.put("sendCandidateInvite", true);
        settings.put("attachMeetingLinks", true);
        settings.put("syncUpdates", true);
        settings.put("removeCancelledEvents", true);
        settings.put("reminderTime", "30_MINUTES");
        settings.put("workingStart", "09:00");
        settings.put("workingEnd", "18:00");
        return settings;
    }
}
