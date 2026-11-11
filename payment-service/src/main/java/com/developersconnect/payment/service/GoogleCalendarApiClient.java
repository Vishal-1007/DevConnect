package com.developersconnect.payment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GoogleCalendarApiClient {

    private static final String CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
    private static final DateTimeFormatter RFC3339 = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GoogleCalendarApiClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public void testConnection(String accessToken) {
        try {
            restClient.get()
                .uri(CALENDAR_BASE + "/users/me/calendarList")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientResponseException ex) {
            throw mapGoogleError(ex, "Google Calendar connection test failed");
        }
    }

    public CalendarEventResult createEvent(
        String accessToken,
        CalendarEventPayload payload,
        boolean sendInvites
    ) {
        ObjectNode body = buildEventBody(payload);
        String uri = UriComponentsBuilder.fromHttpUrl(CALENDAR_BASE + "/calendars/primary/events")
            .queryParam("sendUpdates", sendInvites ? "all" : "none")
            .build()
            .toUriString();

        try {
            JsonNode response = restClient.post()
                .uri(uri)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body.toString())
                .retrieve()
                .body(JsonNode.class);

            return toResult(response);
        } catch (RestClientResponseException ex) {
            throw mapGoogleError(ex, "Failed to create Google Calendar event");
        }
    }

    public CalendarEventResult updateEvent(
        String accessToken,
        String eventId,
        CalendarEventPayload payload,
        boolean sendInvites
    ) {
        ObjectNode body = buildEventBody(payload);
        String uri = UriComponentsBuilder.fromHttpUrl(
                CALENDAR_BASE + "/calendars/primary/events/" + encodeEventId(eventId)
            )
            .queryParam("sendUpdates", sendInvites ? "all" : "none")
            .build()
            .toUriString();

        try {
            JsonNode response = restClient.patch()
                .uri(uri)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body.toString())
                .retrieve()
                .body(JsonNode.class);

            return toResult(response);
        } catch (RestClientResponseException ex) {
            throw mapGoogleError(ex, "Failed to update Google Calendar event");
        }
    }

    public void deleteEvent(String accessToken, String eventId) {
        String uri = UriComponentsBuilder.fromHttpUrl(
                CALENDAR_BASE + "/calendars/primary/events/" + encodeEventId(eventId)
            )
            .queryParam("sendUpdates", "all")
            .build()
            .toUriString();

        try {
            restClient.delete()
                .uri(uri)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404 || ex.getStatusCode().value() == 410) {
                return;
            }
            throw mapGoogleError(ex, "Failed to delete Google Calendar event");
        }
    }

    private ObjectNode buildEventBody(CalendarEventPayload payload) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("summary", payload.summary());
        body.put("description", payload.description());
        if (payload.location() != null && !payload.location().isBlank()) {
            body.put("location", payload.location());
        }

        ObjectNode start = objectMapper.createObjectNode();
        start.put("dateTime", formatInstant(payload.start()));
        start.put("timeZone", "UTC");
        body.set("start", start);

        ObjectNode end = objectMapper.createObjectNode();
        end.put("dateTime", formatInstant(payload.end()));
        end.put("timeZone", "UTC");
        body.set("end", end);

        if (payload.reminderMinutes() > 0) {
            ObjectNode reminders = objectMapper.createObjectNode();
            reminders.put("useDefault", false);
            ArrayNode overrides = objectMapper.createArrayNode();
            ObjectNode reminder = objectMapper.createObjectNode();
            reminder.put("method", "popup");
            reminder.put("minutes", payload.reminderMinutes());
            overrides.add(reminder);
            reminders.set("overrides", overrides);
            body.set("reminders", reminders);
        }

        List<CalendarAttendee> attendees = payload.attendees();
        if (!attendees.isEmpty()) {
            ArrayNode attendeeNodes = objectMapper.createArrayNode();
            for (CalendarAttendee attendee : attendees) {
                if (attendee.email() == null || attendee.email().isBlank()) {
                    continue;
                }
                ObjectNode node = objectMapper.createObjectNode();
                node.put("email", attendee.email());
                attendeeNodes.add(node);
            }
            if (!attendeeNodes.isEmpty()) {
                body.set("attendees", attendeeNodes);
            }
        }

        return body;
    }

    private CalendarEventResult toResult(JsonNode response) {
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty Google Calendar response");
        }
        String eventId = response.path("id").asText(null);
        String htmlLink = response.path("htmlLink").asText(null);
        String hangoutLink = response.path("hangoutLink").asText(null);
        String meetingLink = hangoutLink != null ? hangoutLink : htmlLink;
        return new CalendarEventResult(eventId, meetingLink);
    }

    private String formatInstant(Instant instant) {
        return RFC3339.format(instant.atOffset(ZoneOffset.UTC));
    }

    private String encodeEventId(String eventId) {
        return eventId.replace("@", "%40");
    }

    private ResponseStatusException mapGoogleError(RestClientResponseException ex, String fallback) {
        String message = fallback;
        try {
            JsonNode body = objectMapper.readTree(ex.getResponseBodyAsString());
            if (body.hasNonNull("error")) {
                JsonNode error = body.get("error");
                if (error.hasNonNull("message")) {
                    message = error.get("message").asText(fallback);
                }
            }
        } catch (Exception ignored) {
            // keep fallback
        }
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        return new ResponseStatusException(status != null ? status : HttpStatus.BAD_GATEWAY, message);
    }

    public record CalendarAttendee(String email) {}

    public record CalendarEventPayload(
        String summary,
        String description,
        String location,
        Instant start,
        Instant end,
        int reminderMinutes,
        List<CalendarAttendee> attendees
    ) {
        public CalendarEventPayload {
            attendees = attendees != null ? new ArrayList<>(attendees) : List.of();
        }
    }

    public record CalendarEventResult(String eventId, String meetingLink) {}
}
