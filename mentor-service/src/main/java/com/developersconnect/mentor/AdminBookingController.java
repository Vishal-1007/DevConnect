package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.BookingAnalyticsResponse;
import com.developersconnect.mentor.dto.MentorAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorshipBookingResponse;
import com.developersconnect.mentor.dto.UpdateMentorshipBookingRequest;
import com.developersconnect.mentor.service.AdminBookingService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/admin/bookings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    public AdminBookingController(AdminBookingService adminBookingService) {
        this.adminBookingService = adminBookingService;
    }

    @GetMapping
    public ResponseEntity<List<MentorshipBookingResponse>> listBookings(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(required = false) String filter,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminBookingService.listBookings(status, filter, q, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<BookingAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminBookingService.getAnalytics());
    }

    @GetMapping("/availability")
    public ResponseEntity<List<MentorAvailabilityResponse>> mentorAvailability() {
        return ResponseEntity.ok(adminBookingService.listMentorAvailability());
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<MentorshipBookingResponse> getBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.getBooking(bookingId));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<MentorshipBookingResponse> updateBooking(
        @PathVariable UUID bookingId,
        @RequestBody UpdateMentorshipBookingRequest request
    ) {
        return ResponseEntity.ok(adminBookingService.updateBooking(bookingId, request));
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<MentorshipBookingResponse> confirm(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.confirmBooking(bookingId));
    }

    @PostMapping("/{bookingId}/complete")
    public ResponseEntity<MentorshipBookingResponse> complete(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.completeBooking(bookingId));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<MentorshipBookingResponse> cancel(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.cancelBooking(bookingId));
    }

    @PostMapping("/{bookingId}/refund-request")
    public ResponseEntity<MentorshipBookingResponse> requestRefund(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.requestRefund(bookingId));
    }

    @PostMapping("/{bookingId}/refund-approve")
    public ResponseEntity<MentorshipBookingResponse> approveRefund(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.approveRefund(bookingId));
    }

    @PostMapping("/{bookingId}/refund-reject")
    public ResponseEntity<MentorshipBookingResponse> rejectRefund(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(adminBookingService.rejectRefund(bookingId));
    }
}
