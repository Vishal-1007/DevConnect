package com.developersconnect.user;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.user.dto.ApplyMentorEventRoleRequest;
import com.developersconnect.user.dto.CommunityEventResponse;
import com.developersconnect.user.dto.CreateMentorEventRequest;
import com.developersconnect.user.dto.MentorEventDashboardResponse;
import com.developersconnect.user.dto.MentorEventRegistrationResponse;
import com.developersconnect.user.dto.MentorEventResponse;
import com.developersconnect.user.dto.MentorEventSummaryResponse;
import com.developersconnect.user.dto.MentorHostedEventManageResponse;
import com.developersconnect.user.dto.UpdateMentorEventRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.EventCommerceService;
import com.developersconnect.user.service.MentorEventService;
import com.developersconnect.user.service.MentorHostedEventService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/me/events")
public class MentorEventController {

    private final MentorEventService mentorEventService;
    private final MentorHostedEventService mentorHostedEventService;
    private final EventCommerceService eventCommerceService;

    public MentorEventController(
        MentorEventService mentorEventService,
        MentorHostedEventService mentorHostedEventService,
        EventCommerceService eventCommerceService
    ) {
        this.mentorEventService = mentorEventService;
        this.mentorHostedEventService = mentorHostedEventService;
        this.eventCommerceService = eventCommerceService;
    }

    @GetMapping
    public ResponseEntity<List<MentorEventResponse>> listEvents(
        Authentication authentication,
        @RequestParam(defaultValue = "upcoming") String when,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "false") boolean mineOnly,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorEventService.listEvents(
                principal.accountId(), principal.roles(), when, type, q, mineOnly, limit
            )
        );
    }

    @GetMapping("/summary")
    public ResponseEntity<MentorEventSummaryResponse> getSummary(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorEventService.getSummary(principal.accountId(), principal.roles()));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<MentorEventResponse> getEvent(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorEventService.getEvent(principal.accountId(), principal.roles(), eventId));
    }

    @PostMapping("/{eventId}/roles")
    public ResponseEntity<MentorEventResponse> applyForRole(
        Authentication authentication,
        @PathVariable UUID eventId,
        @Valid @RequestBody ApplyMentorEventRoleRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorEventService.applyForRole(principal.accountId(), principal.roles(), eventId, request)
        );
    }

    @DeleteMapping("/{eventId}/roles/{role}")
    public ResponseEntity<MentorEventResponse> withdrawRole(
        Authentication authentication,
        @PathVariable UUID eventId,
        @PathVariable String role
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorEventService.withdrawRole(principal.accountId(), principal.roles(), eventId, role)
        );
    }

    @PostMapping("/host")
    public ResponseEntity<CommunityEventResponse> createHostedEvent(
        Authentication authentication,
        @Valid @RequestBody CreateMentorEventRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mentorHostedEventService.createMentorEvent(
                principal.accountId(), principal.username(), principal.roles(), request
            ));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<MentorEventDashboardResponse> dashboard(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(eventCommerceService.getMentorDashboard(principal.accountId()));
    }

    @GetMapping("/hosted")
    public ResponseEntity<List<CommunityEventResponse>> listHostedEvents(
        Authentication authentication,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorHostedEventService.listHostedEvents(principal.accountId(), limit));
    }

    @GetMapping("/hosted/{eventId}/manage")
    public ResponseEntity<MentorHostedEventManageResponse> getHostedEventManage(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorHostedEventService.getHostedEventManage(principal.accountId(), eventId)
        );
    }

    @GetMapping("/hosted/{eventId}/registrations")
    public ResponseEntity<List<MentorEventRegistrationResponse>> listHostedEventRegistrations(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorHostedEventService.listHostedEventRegistrations(principal.accountId(), eventId)
        );
    }

    @PutMapping("/hosted/{eventId}")
    public ResponseEntity<CommunityEventResponse> updateHostedEvent(
        Authentication authentication,
        @PathVariable UUID eventId,
        @Valid @RequestBody UpdateMentorEventRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorHostedEventService.updateHostedEvent(principal.accountId(), eventId, request)
        );
    }

    @DeleteMapping("/hosted/{eventId}")
    public ResponseEntity<CommunityEventResponse> cancelHostedEvent(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            mentorHostedEventService.cancelHostedEvent(principal.accountId(), eventId)
        );
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Void> requestWithdrawal(
        Authentication authentication,
        @RequestParam int amountInr
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        eventCommerceService.requestWithdrawal(principal.accountId(), amountInr);
        return ResponseEntity.noContent().build();
    }
}
