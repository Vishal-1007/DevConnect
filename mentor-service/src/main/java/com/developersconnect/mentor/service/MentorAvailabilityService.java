package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MentorPublicAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorPublicAvailabilityResponse.DailySlotsResponse;
import com.developersconnect.mentor.dto.MentorPublicAvailabilityResponse.WeeklySlotResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.AvailableSlotResponse;
import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.model.MockInterviewRequest;
import com.developersconnect.mentor.model.MockInterviewRequest.Status;
import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import com.developersconnect.mentor.repository.MockInterviewRequestRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorAvailabilityService {

    private static final Set<Status> BLOCKING_MOCK_STATUSES = EnumSet.of(Status.PENDING, Status.ACCEPTED);
    private static final Set<String> BLOCKING_MENTORSHIP_STATUSES = Set.of("pending", "confirmed");
    private static final String[] DAY_LABELS = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };
    private static final DateTimeFormatter TIME_24 = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final MentorAvailabilitySlotRepository availabilityRepository;
    private final MentorProfileRepository profileRepository;
    private final MockInterviewRequestRepository mockRequestRepository;
    private final MentorshipBookingRepository mentorshipBookingRepository;

    public MentorAvailabilityService(
        MentorAvailabilitySlotRepository availabilityRepository,
        MentorProfileRepository profileRepository,
        MockInterviewRequestRepository mockRequestRepository,
        MentorshipBookingRepository mentorshipBookingRepository
    ) {
        this.availabilityRepository = availabilityRepository;
        this.profileRepository = profileRepository;
        this.mockRequestRepository = mockRequestRepository;
        this.mentorshipBookingRepository = mentorshipBookingRepository;
    }

    @Transactional(readOnly = true)
    public MentorPublicAvailabilityResponse getPublicAvailabilityByLocalDates(
        UUID mentorId,
        LocalDate fromDate,
        LocalDate toDate,
        int durationMinutes
    ) {
        MentorProfile profile = requireBookableProfile(mentorId);
        ZoneId zone = resolveZone(profile);
        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now(zone);
        LocalDate endDate = toDate != null ? toDate : startDate.plusDays(14);
        if (endDate.isBefore(startDate)) {
            endDate = startDate;
        }

        List<MentorAvailabilitySlot> windows = loadActiveWindows(mentorId);
        List<AvailableSlotResponse> slots = buildSlotResponsesForLocalDates(
            mentorId, profile, windows, zone, startDate, endDate, durationMinutes, true
        );

        return toPublicResponse(profile, mentorId, windows, slots);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlotsForDate(
        UUID mentorId,
        LocalDate date,
        int durationMinutes
    ) {
        MentorProfile profile = requireBookableProfile(mentorId);
        if (profile.isVacationMode() || !profile.isAvailable()) {
            return List.of();
        }
        ZoneId zone = resolveZone(profile);
        List<MentorAvailabilitySlot> windows = loadActiveWindows(mentorId);
        if (windows.isEmpty() || date == null) {
            return List.of();
        }
        return buildSlotResponsesForLocalDates(
            mentorId, profile, windows, zone, date, date, durationMinutes, true
        );
    }

    @Transactional(readOnly = true)
    public MentorPublicAvailabilityResponse getPublicAvailability(
        UUID mentorId,
        Instant from,
        Instant to,
        int durationMinutes
    ) {
        MentorProfile profile = requireBookableProfile(mentorId);
        ZoneId zone = resolveZone(profile);
        LocalDate startDate = (from != null ? from : Instant.now()).atZone(zone).toLocalDate();
        LocalDate endDate = (to != null ? to : Instant.now().plus(14, ChronoUnit.DAYS)).atZone(zone).toLocalDate();
        return getPublicAvailabilityByLocalDates(mentorId, startDate, endDate, durationMinutes);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getBookableSlots(
        UUID mentorId,
        Instant from,
        Instant to,
        int durationMinutes
    ) {
        MentorProfile profile = requireBookableProfile(mentorId);
        if (profile.isVacationMode() || !profile.isAvailable()) {
            return List.of();
        }
        ZoneId zone = resolveZone(profile);
        List<MentorAvailabilitySlot> windows = loadActiveWindows(mentorId);
        if (windows.isEmpty()) {
            return List.of();
        }
        LocalDate startDate = (from != null ? from : Instant.now()).atZone(zone).toLocalDate();
        LocalDate endDate = (to != null ? to : Instant.now().plus(14, ChronoUnit.DAYS)).atZone(zone).toLocalDate();
        return buildSlotResponsesForLocalDates(
            mentorId, profile, windows, zone, startDate, endDate, durationMinutes, true
        );
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getBookableSlotsByLocalDates(
        UUID mentorId,
        LocalDate fromDate,
        LocalDate toDate,
        int durationMinutes
    ) {
        MentorProfile profile = requireBookableProfile(mentorId);
        if (profile.isVacationMode() || !profile.isAvailable()) {
            return List.of();
        }
        List<MentorAvailabilitySlot> windows = loadActiveWindows(mentorId);
        if (windows.isEmpty()) {
            return List.of();
        }
        ZoneId zone = resolveZone(profile);
        LocalDate startDate = fromDate != null ? fromDate : LocalDate.now(zone);
        LocalDate endDate = toDate != null ? toDate : startDate.plusDays(14);
        return buildSlotResponsesForLocalDates(
            mentorId, profile, windows, zone, startDate, endDate, durationMinutes, true
        );
    }

    @Transactional(readOnly = true)
    public void assertSlotAvailable(UUID mentorId, Instant start, Instant end) {
        int duration = (int) ChronoUnit.MINUTES.between(start, end);
        if (duration <= 0) {
            duration = 30;
        }
        boolean found = getBookableSlots(
            mentorId,
            start.minus(1, ChronoUnit.SECONDS),
            end.plus(1, ChronoUnit.SECONDS),
            duration
        ).stream()
            .anyMatch(s -> s.available() && s.startAt().equals(start.toString()));
        if (!found) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected slot is no longer available");
        }
    }

    private MentorPublicAvailabilityResponse toPublicResponse(
        MentorProfile profile,
        UUID mentorId,
        List<MentorAvailabilitySlot> windows,
        List<AvailableSlotResponse> slots
    ) {
        List<WeeklySlotResponse> weekly = windows.stream()
            .map(w -> new WeeklySlotResponse(
                w.getDayOfWeek(),
                dayLabel(w.getDayOfWeek()),
                w.getStartTime(),
                w.getEndTime()
            ))
            .toList();

        Map<String, List<String>> byDate = new LinkedHashMap<>();
        for (AvailableSlotResponse slot : slots) {
            if (!slot.available()) {
                continue;
            }
            byDate.computeIfAbsent(slot.date(), k -> new ArrayList<>()).add(slot.time());
        }

        List<DailySlotsResponse> daily = byDate.entrySet().stream()
            .map(e -> new DailySlotsResponse(e.getKey(), List.copyOf(e.getValue())))
            .toList();

        ZoneId zone = resolveZone(profile);
        String mentorName = firstNonBlank(profile.getFullName(), profile.getHeadline(), "Mentor");
        return new MentorPublicAvailabilityResponse(
            mentorId,
            mentorName,
            profile.isVacationMode(),
            profile.isAvailable() && !profile.isVacationMode() && !windows.isEmpty(),
            profile.isAutoSchedulingEnabled(),
            zone.getId(),
            weekly,
            daily,
            slots
        );
    }

    private List<AvailableSlotResponse> buildSlotResponsesForLocalDates(
        UUID mentorId,
        MentorProfile profile,
        List<MentorAvailabilitySlot> windows,
        ZoneId zone,
        LocalDate startDate,
        LocalDate endDate,
        int durationMinutes,
        boolean includeUnavailable
    ) {
        if (durationMinutes <= 0) {
            durationMinutes = 30;
        }

        Instant rangeStart = startDate.atStartOfDay(zone).toInstant();
        Instant rangeEnd = endDate.plusDays(1).atStartOfDay(zone).toInstant();

        List<MockInterviewRequest> mockBooked = mockRequestRepository
            .loadScheduledByInterviewerAndStatuses(mentorId, BLOCKING_MOCK_STATUSES);
        List<MentorshipBooking> mentorshipBooked = mentorshipBookingRepository
            .findByMentorIdOrderByScheduledAtDesc(mentorId, org.springframework.data.domain.PageRequest.of(0, 500))
            .stream()
            .filter(b -> BLOCKING_MENTORSHIP_STATUSES.contains(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(rangeStart.minus(1, ChronoUnit.DAYS)))
            .toList();

        List<AvailableSlotResponse> slots = new ArrayList<>();
        LocalDate cursor = startDate;
        Instant now = Instant.now();

        while (!cursor.isAfter(endDate)) {
            int dow = cursor.getDayOfWeek().getValue() % 7;
            for (MentorAvailabilitySlot window : windows) {
                if (window.getDayOfWeek() != dow) {
                    continue;
                }
                LocalTime windowStart = parseLocalTime(window.getStartTime());
                LocalTime windowEnd = parseLocalTime(window.getEndTime());
                ZonedDateTime slotStart = ZonedDateTime.of(cursor, windowStart, zone);
                while (slotStart.toLocalTime().plusMinutes(durationMinutes).compareTo(windowEnd) <= 0) {
                    Instant slotInstant = slotStart.toInstant();
                    Instant slotEnd = slotInstant.plus(durationMinutes, ChronoUnit.MINUTES);
                    if (!slotInstant.isBefore(rangeStart) && slotInstant.isBefore(rangeEnd)) {
                        boolean isPast = !slotInstant.isAfter(now);
                        boolean booked = overlapsMockBooking(mockBooked, slotInstant, slotEnd)
                            || overlapsMentorshipBooking(mentorshipBooked, slotInstant, slotEnd);
                        boolean available = !isPast && !booked && !profile.isVacationMode() && profile.isAvailable();
                        if (available || includeUnavailable) {
                            slots.add(new AvailableSlotResponse(
                                slotInstant.toString(),
                                slotEnd.toString(),
                                cursor.format(DATE_FMT),
                                slotStart.format(TIME_24),
                                durationMinutes,
                                available
                            ));
                        }
                    }
                    slotStart = slotStart.plusMinutes(durationMinutes);
                }
            }
            cursor = cursor.plusDays(1);
        }
        return slots;
    }

    private LocalTime parseLocalTime(String value) {
        String normalized = value != null ? value.trim() : "09:00";
        if (normalized.length() > 5) {
            normalized = normalized.substring(0, 5);
        }
        return LocalTime.parse(normalized, TIME_24);
    }

    private List<MentorAvailabilitySlot> loadActiveWindows(UUID mentorId) {
        return availabilityRepository
            .findAllByMentorIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(mentorId);
    }

    private MentorProfile requireBookableProfile(UUID mentorId) {
        return profileRepository.findById(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not found"));
    }

    private ZoneId resolveZone(MentorProfile profile) {
        String tz = profile.getAvailabilityTimezone();
        if (tz == null || tz.isBlank()) {
            return ZoneId.of("Asia/Kolkata");
        }
        try {
            return ZoneId.of(tz.trim());
        } catch (Exception ex) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    private boolean overlapsMockBooking(List<MockInterviewRequest> booked, Instant start, Instant end) {
        for (MockInterviewRequest request : booked) {
            Instant bookedStart = request.getScheduledAt();
            if (bookedStart == null) {
                continue;
            }
            Instant bookedEnd = request.getSlotEndAt() != null
                ? request.getSlotEndAt()
                : bookedStart.plus(30, ChronoUnit.MINUTES);
            if (start.isBefore(bookedEnd) && end.isAfter(bookedStart)) {
                return true;
            }
        }
        return false;
    }

    private boolean overlapsMentorshipBooking(List<MentorshipBooking> booked, Instant start, Instant end) {
        for (MentorshipBooking booking : booked) {
            Instant bookedStart = booking.getScheduledAt();
            Instant bookedEnd = bookedStart.plus(
                booking.getDurationMinutes() > 0 ? booking.getDurationMinutes() : 60,
                ChronoUnit.MINUTES
            );
            if (start.isBefore(bookedEnd) && end.isAfter(bookedStart)) {
                return true;
            }
        }
        return false;
    }

    private String dayLabel(int dayOfWeek) {
        if (dayOfWeek >= 0 && dayOfWeek < DAY_LABELS.length) {
            return DAY_LABELS[dayOfWeek];
        }
        return "Day " + dayOfWeek;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
