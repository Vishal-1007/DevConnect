package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MockInterviewDtos.AvailableSlotResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MockInterviewSlotService {

    private final MentorAvailabilityService availabilityService;

    public MockInterviewSlotService(MentorAvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(
        UUID interviewerId,
        Instant from,
        Instant to,
        int durationMinutes
    ) {
        return availabilityService.getBookableSlots(interviewerId, from, to, durationMinutes);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getBookableSlotsByLocalDates(
        UUID interviewerId,
        LocalDate fromDate,
        LocalDate toDate,
        int durationMinutes
    ) {
        return availabilityService.getBookableSlotsByLocalDates(interviewerId, fromDate, toDate, durationMinutes);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlotsForDate(
        UUID interviewerId,
        LocalDate date,
        int durationMinutes
    ) {
        return availabilityService.getAvailableSlotsForDate(interviewerId, date, durationMinutes);
    }

    @Transactional(readOnly = true)
    public void assertSlotAvailable(UUID interviewerId, Instant start, Instant end) {
        availabilityService.assertSlotAvailable(interviewerId, start, end);
    }
}
