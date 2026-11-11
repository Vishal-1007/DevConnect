package com.developersconnect.payment;

import com.developersconnect.payment.dto.InterviewCalendarEventRequest;
import com.developersconnect.payment.dto.InterviewCalendarEventResponse;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.security.RecruiterAuth;
import com.developersconnect.payment.service.RecruiterCalendarService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiter/calendar")
public class RecruiterCalendarController {

    private final RecruiterCalendarService calendarService;

    public RecruiterCalendarController(RecruiterCalendarService calendarService) {
        this.calendarService = calendarService;
    }

    @PostMapping("/events")
    public ResponseEntity<InterviewCalendarEventResponse> createInterviewEvent(
        Authentication authentication,
        @Valid @RequestBody InterviewCalendarEventRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(calendarService.createInterviewEvent(principal.accountId(), request));
    }

    @PutMapping("/events/{googleEventId}")
    public ResponseEntity<InterviewCalendarEventResponse> updateInterviewEvent(
        Authentication authentication,
        @PathVariable String googleEventId,
        @Valid @RequestBody InterviewCalendarEventRequest request
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(
            calendarService.updateInterviewEvent(principal.accountId(), googleEventId, request)
        );
    }

    @DeleteMapping("/events/{googleEventId}")
    public ResponseEntity<InterviewCalendarEventResponse> deleteInterviewEvent(
        Authentication authentication,
        @PathVariable String googleEventId
    ) {
        AuthPrincipal principal = RecruiterAuth.requireRecruiterRole(authentication);
        return ResponseEntity.ok(calendarService.deleteInterviewEvent(principal.accountId(), googleEventId));
    }
}
