package com.developersconnect.user;

import com.developersconnect.user.dto.CreateMentorWebinarRequest;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.MentorWebinarAnalyticsResponse;
import com.developersconnect.user.dto.MentorWebinarResponse;
import com.developersconnect.user.dto.MentorWebinarSummaryResponse;
import com.developersconnect.user.dto.UpdateMentorWebinarStreamRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.MentorWebinarService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/users/me/webinars")
public class MentorWebinarController {

    private final MentorWebinarService mentorWebinarService;

    public MentorWebinarController(MentorWebinarService mentorWebinarService) {
        this.mentorWebinarService = mentorWebinarService;
    }

    @GetMapping
    public ResponseEntity<List<MentorWebinarResponse>> listMyWebinars(
        Authentication authentication,
        @RequestParam(defaultValue = "upcoming") String when,
        @RequestParam(required = false) String streamStatus,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorWebinarService.listMyWebinars(principal.accountId(), when, streamStatus, limit)
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<MentorWebinarSummaryResponse> getSummary(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.getSummary(principal.accountId()));
    }

    @PostMapping
    public ResponseEntity<MentorWebinarResponse> createWebinar(
        Authentication authentication,
        @Valid @RequestBody CreateMentorWebinarRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mentorWebinarService.createWebinar(
                principal.accountId(), principal.username(), request
            ));
    }

    @GetMapping("/{webinarId}")
    public ResponseEntity<MentorWebinarResponse> getWebinar(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.getWebinar(principal.accountId(), webinarId));
    }

    @GetMapping("/{webinarId}/attendees")
    public ResponseEntity<List<EventRegistrationResponse>> listAttendees(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.listAttendees(principal.accountId(), webinarId));
    }

    @GetMapping("/{webinarId}/analytics")
    public ResponseEntity<MentorWebinarAnalyticsResponse> getAnalytics(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.getAnalytics(principal.accountId(), webinarId));
    }

    @PostMapping("/{webinarId}/go-live")
    public ResponseEntity<MentorWebinarResponse> goLive(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.goLive(principal.accountId(), webinarId));
    }

    @PostMapping("/{webinarId}/end-stream")
    public ResponseEntity<MentorWebinarResponse> endStream(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.endStream(principal.accountId(), webinarId));
    }

    @PutMapping("/{webinarId}/stream")
    public ResponseEntity<MentorWebinarResponse> updateStream(
        Authentication authentication,
        @PathVariable UUID webinarId,
        @Valid @RequestBody UpdateMentorWebinarStreamRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.updateStream(principal.accountId(), webinarId, request));
    }

    @PostMapping("/{webinarId}/cancel")
    public ResponseEntity<MentorWebinarResponse> cancelWebinar(
        Authentication authentication,
        @PathVariable UUID webinarId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorWebinarService.cancelWebinar(principal.accountId(), webinarId));
    }
}
