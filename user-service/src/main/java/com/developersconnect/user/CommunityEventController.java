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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.user.dto.CommunityEventResponse;
import com.developersconnect.user.dto.ConfirmEventPaymentRequest;
import com.developersconnect.user.dto.CreateCommunityEventRequest;
import com.developersconnect.user.dto.EventOrderResponse;
import com.developersconnect.user.dto.EventStatsResponse;
import com.developersconnect.user.dto.PopularHostResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CommunityEventService;
import com.developersconnect.user.service.EventCommerceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/events")
public class CommunityEventController {

    private final CommunityEventService communityEventService;
    private final EventCommerceService eventCommerceService;

    public CommunityEventController(
        CommunityEventService communityEventService,
        EventCommerceService eventCommerceService
    ) {
        this.communityEventService = communityEventService;
        this.eventCommerceService = eventCommerceService;
    }

    @GetMapping
    public ResponseEntity<List<CommunityEventResponse>> listEvents(
        Authentication authentication,
        @RequestParam(defaultValue = "upcoming") String when,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            communityEventService.listEvents(
                principal.accountId(), when, category, type, q, limit
            )
        );
    }

    @PostMapping
    public ResponseEntity<CommunityEventResponse> createEvent(
        Authentication authentication,
        @Valid @RequestBody CreateCommunityEventRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(communityEventService.createEvent(principal.accountId(), principal.username(), request));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<CommunityEventResponse> getEvent(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityEventService.getEvent(eventId, principal.accountId()));
    }

    @PostMapping("/{eventId}/register")
    public ResponseEntity<CommunityEventResponse> register(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityEventService.register(eventId, principal.accountId()));
    }

    @DeleteMapping("/{eventId}/register")
    public ResponseEntity<CommunityEventResponse> unregister(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityEventService.unregister(eventId, principal.accountId()));
    }

    @GetMapping("/stats")
    public ResponseEntity<EventStatsResponse> stats(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(eventCommerceService.getUserStats(principal.accountId()));
    }

    @GetMapping("/my-registrations")
    public ResponseEntity<List<CommunityEventResponse>> myRegistrations(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityEventService.listMyRegistrations(principal.accountId()));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<CommunityEventResponse>> bookmarks(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityEventService.listBookmarkedEvents(principal.accountId()));
    }

    @GetMapping("/popular-hosts")
    public ResponseEntity<List<PopularHostResponse>> popularHosts(
        @RequestParam(defaultValue = "6") int limit
    ) {
        return ResponseEntity.ok(eventCommerceService.getPopularHosts(limit));
    }

    @PostMapping("/{eventId}/bookmark")
    public ResponseEntity<Void> toggleBookmark(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        eventCommerceService.toggleBookmark(eventId, principal.accountId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{eventId}/payment/create-order")
    public ResponseEntity<EventOrderResponse> createPaymentOrder(
        Authentication authentication,
        @PathVariable UUID eventId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(eventCommerceService.createPaymentOrder(eventId, principal.accountId()));
    }

    @PostMapping("/{eventId}/payment/confirm")
    public ResponseEntity<CommunityEventResponse> confirmPayment(
        Authentication authentication,
        @PathVariable UUID eventId,
        @Valid @RequestBody ConfirmEventPaymentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        eventCommerceService.confirmPayment(eventId, principal.accountId(), request);
        return ResponseEntity.ok(communityEventService.getEvent(eventId, principal.accountId()));
    }
}
