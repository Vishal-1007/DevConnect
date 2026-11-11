package com.developersconnect.user;

import com.developersconnect.user.dto.AdminCommunityEventResponse;
import com.developersconnect.user.dto.CommunityEventResponse;
import com.developersconnect.user.dto.CreateAdminCommunityEventRequest;
import com.developersconnect.user.dto.EventAnalyticsResponse;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.EventRevenueAnalyticsResponse;
import com.developersconnect.user.dto.UpdateAdminCommunityEventRequest;
import com.developersconnect.user.model.EventWithdrawal;
import com.developersconnect.user.repository.EventWithdrawalRepository;
import com.developersconnect.user.service.AdminCommunityEventService;
import com.developersconnect.user.service.CommunityEventService;
import com.developersconnect.user.service.EventCommerceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/events")
public class AdminCommunityEventController {

    private final AdminCommunityEventService adminCommunityEventService;
    private final CommunityEventService communityEventService;
    private final EventCommerceService eventCommerceService;
    private final EventWithdrawalRepository withdrawalRepository;

    public AdminCommunityEventController(
        AdminCommunityEventService adminCommunityEventService,
        CommunityEventService communityEventService,
        EventCommerceService eventCommerceService,
        EventWithdrawalRepository withdrawalRepository
    ) {
        this.adminCommunityEventService = adminCommunityEventService;
        this.communityEventService = communityEventService;
        this.eventCommerceService = eventCommerceService;
        this.withdrawalRepository = withdrawalRepository;
    }

    @GetMapping
    public ResponseEntity<List<AdminCommunityEventResponse>> listEvents(
        @RequestParam(defaultValue = "upcoming") String when,
        @RequestParam(defaultValue = "active") String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(
            adminCommunityEventService.listEvents(when, category, type, q, status, limit)
        );
    }

    @GetMapping("/analytics")
    public ResponseEntity<EventAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminCommunityEventService.getAnalytics());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<AdminCommunityEventResponse> getEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(adminCommunityEventService.getEvent(eventId));
    }

    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<List<EventRegistrationResponse>> listRegistrations(@PathVariable UUID eventId) {
        return ResponseEntity.ok(adminCommunityEventService.listRegistrations(eventId));
    }

    @PostMapping
    public ResponseEntity<AdminCommunityEventResponse> createEvent(
        @Valid @RequestBody CreateAdminCommunityEventRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminCommunityEventService.createEvent(request));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<AdminCommunityEventResponse> updateEvent(
        @PathVariable UUID eventId,
        @Valid @RequestBody UpdateAdminCommunityEventRequest request
    ) {
        return ResponseEntity.ok(adminCommunityEventService.updateEvent(eventId, request));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<AdminCommunityEventResponse> cancelEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(adminCommunityEventService.cancelEvent(eventId));
    }

    @PostMapping("/{eventId}/restore")
    public ResponseEntity<AdminCommunityEventResponse> restoreEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(adminCommunityEventService.restoreEvent(eventId));
    }

    @GetMapping("/revenue")
    public ResponseEntity<EventRevenueAnalyticsResponse> revenue() {
        return ResponseEntity.ok(eventCommerceService.getRevenueAnalytics());
    }

    @PostMapping("/{eventId}/approve")
    public ResponseEntity<CommunityEventResponse> approveEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(communityEventService.approveEvent(eventId));
    }

    @PostMapping("/{eventId}/reject")
    public ResponseEntity<CommunityEventResponse> rejectEvent(
        @PathVariable UUID eventId,
        @RequestParam(required = false) String note
    ) {
        return ResponseEntity.ok(communityEventService.rejectEvent(eventId, note));
    }

    @PutMapping("/{eventId}/featured")
    public ResponseEntity<CommunityEventResponse> setFeatured(
        @PathVariable UUID eventId,
        @RequestParam boolean featured
    ) {
        return ResponseEntity.ok(communityEventService.setFeatured(eventId, featured));
    }

    @GetMapping("/withdrawals")
    public ResponseEntity<List<EventWithdrawal>> listWithdrawals(
        @RequestParam(defaultValue = "pending") String status
    ) {
        return ResponseEntity.ok(withdrawalRepository.findAllByStatusOrderByRequestedAtDesc(status));
    }

    @PostMapping("/withdrawals/{withdrawalId}/approve")
    public ResponseEntity<Void> approveWithdrawal(@PathVariable UUID withdrawalId) {
        eventCommerceService.approveWithdrawal(withdrawalId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/withdrawals/{withdrawalId}/reject")
    public ResponseEntity<Void> rejectWithdrawal(
        @PathVariable UUID withdrawalId,
        @RequestParam(required = false) String note
    ) {
        eventCommerceService.rejectWithdrawal(withdrawalId, note);
        return ResponseEntity.noContent().build();
    }
}
