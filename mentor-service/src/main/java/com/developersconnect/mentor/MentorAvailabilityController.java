package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MentorMyAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorPublicAvailabilityResponse;
import com.developersconnect.mentor.dto.MockInterviewDtos.AvailableSlotResponse;
import com.developersconnect.mentor.dto.SaveMentorAvailabilityRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorAvailabilityService;
import com.developersconnect.mentor.service.MentorWorkspaceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentor")
public class MentorAvailabilityController {

    private final MentorAvailabilityService availabilityService;
    private final MentorWorkspaceService workspaceService;

    public MentorAvailabilityController(
        MentorAvailabilityService availabilityService,
        MentorWorkspaceService workspaceService
    ) {
        this.availabilityService = availabilityService;
        this.workspaceService = workspaceService;
    }

    @GetMapping("/{mentorId}/availability")
    public ResponseEntity<MentorPublicAvailabilityResponse> getMentorAvailability(
        @PathVariable UUID mentorId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(defaultValue = "30") int durationMinutes
    ) {
        if (date != null) {
            return ResponseEntity.ok(
                availabilityService.getPublicAvailabilityByLocalDates(mentorId, date, date, durationMinutes)
            );
        }
        if (fromDate != null || toDate != null) {
            LocalDate start = fromDate != null ? fromDate : LocalDate.now();
            LocalDate end = toDate != null ? toDate : start.plusDays(14);
            return ResponseEntity.ok(
                availabilityService.getPublicAvailabilityByLocalDates(mentorId, start, end, durationMinutes)
            );
        }
        return ResponseEntity.ok(
            availabilityService.getPublicAvailabilityByLocalDates(
                mentorId,
                null,
                null,
                durationMinutes
            )
        );
    }

    @GetMapping("/{mentorId}/availability/slots")
    public ResponseEntity<List<AvailableSlotResponse>> getMentorAvailabilitySlots(
        @PathVariable UUID mentorId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(defaultValue = "30") int durationMinutes
    ) {
        if (date != null) {
            return ResponseEntity.ok(
                availabilityService.getAvailableSlotsForDate(mentorId, date, durationMinutes)
            );
        }
        LocalDate start = fromDate != null ? fromDate : LocalDate.now();
        LocalDate end = toDate != null ? toDate : start.plusDays(14);
        return ResponseEntity.ok(
            availabilityService.getBookableSlotsByLocalDates(mentorId, start, end, durationMinutes)
        );
    }

    @PostMapping("/availability")
    public ResponseEntity<MentorMyAvailabilityResponse> saveAvailabilityPost(
        Authentication authentication,
        @Valid @RequestBody SaveMentorAvailabilityRequest request
    ) {
        UUID mentorId = ((AuthPrincipal) authentication.getPrincipal()).accountId();
        return ResponseEntity.ok(workspaceService.saveAvailability(mentorId, request));
    }

    @PutMapping("/availability")
    public ResponseEntity<MentorMyAvailabilityResponse> saveAvailabilityPut(
        Authentication authentication,
        @Valid @RequestBody SaveMentorAvailabilityRequest request
    ) {
        UUID mentorId = ((AuthPrincipal) authentication.getPrincipal()).accountId();
        return ResponseEntity.ok(workspaceService.saveAvailability(mentorId, request));
    }
}
