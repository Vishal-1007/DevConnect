package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.BookingAnalyticsResponse;
import com.developersconnect.mentor.dto.BookingAnalyticsResponse.RevenueTrendPoint;
import com.developersconnect.mentor.dto.MentorAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorAvailabilityResponse.AvailabilitySlotResponse;
import com.developersconnect.mentor.dto.MentorshipBookingResponse;
import com.developersconnect.mentor.dto.UpdateMentorshipBookingRequest;
import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminBookingService {

    private static final Set<String> STATUSES = Set.of(
        "pending", "confirmed", "completed", "cancelled", "refund_requested", "refunded"
    );

    private static final String[] DAY_LABELS = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };

    private final MentorshipBookingRepository bookingRepository;
    private final MentorAvailabilitySlotRepository availabilityRepository;
    private final MentorProfileRepository mentorProfileRepository;

    public AdminBookingService(
        MentorshipBookingRepository bookingRepository,
        MentorAvailabilitySlotRepository availabilityRepository,
        MentorProfileRepository mentorProfileRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.availabilityRepository = availabilityRepository;
        this.mentorProfileRepository = mentorProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<MentorshipBookingResponse> listBookings(
        String status,
        String filter,
        String query,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        String normalizedStatus = normalizeStatus(status);
        boolean refundOnly = "refunds".equalsIgnoreCase(filter);

        if ("scheduled".equalsIgnoreCase(filter)) {
            return bookingRepository.search(null, false, normalizeQuery(query), PageRequest.of(0, safeLimit))
                .stream()
                .filter(b -> isScheduled(b))
                .map(this::toResponse)
                .toList();
        }

        return bookingRepository.search(normalizedStatus, refundOnly, normalizeQuery(query), PageRequest.of(0, safeLimit))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorshipBookingResponse getBooking(UUID bookingId) {
        return toResponse(findBooking(bookingId));
    }

    @Transactional(readOnly = true)
    public BookingAnalyticsResponse getAnalytics() {
        long total = bookingRepository.count();
        long confirmed = bookingRepository.countByStatus("confirmed");
        long pending = bookingRepository.countByStatus("pending");
        long completed = bookingRepository.countByStatus("completed");
        long cancelled = bookingRepository.countByStatus("cancelled");
        long refundRequested = bookingRepository.countByStatus("refund_requested")
            + bookingRepository.countByRefundStatus("requested");
        long refunded = bookingRepository.countByStatus("refunded");

        long scheduled = bookingRepository.findAll().stream().filter(this::isScheduled).count();

        long revenueCents = bookingRepository.sumRevenueCents();
        long refundedCents = bookingRepository.sumRefundedCents();
        long pendingRefundCents = bookingRepository.findAll().stream()
            .filter(b -> "refund_requested".equals(b.getStatus()) || "requested".equals(b.getRefundStatus()))
            .mapToLong(MentorshipBooking::getAmountCents)
            .sum();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : bookingRepository.countGroupByStatus()) {
            byStatus.put((String) row[0], (Long) row[1]);
        }

        List<RevenueTrendPoint> trend = buildRevenueTrend();

        return new BookingAnalyticsResponse(
            total,
            confirmed,
            pending,
            scheduled,
            completed,
            cancelled,
            refundRequested,
            refunded,
            revenueCents,
            formatMoney(revenueCents),
            refundedCents,
            formatMoney(refundedCents),
            pendingRefundCents,
            formatMoney(pendingRefundCents),
            byStatus,
            trend
        );
    }

    @Transactional(readOnly = true)
    public List<MentorAvailabilityResponse> listMentorAvailability() {
        List<MentorProfile> mentors = mentorProfileRepository.findAll();
        List<MentorAvailabilityResponse> result = new ArrayList<>();

        for (MentorProfile mentor : mentors) {
            List<MentorAvailabilitySlot> slots =
                availabilityRepository.findAllByMentorIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(mentor.getUserId());
            String name = mentor.getHeadline() != null ? mentor.getHeadline() : "Mentor";
            result.add(new MentorAvailabilityResponse(
                mentor.getUserId(),
                name,
                mentor.isAvailable(),
                slots.size(),
                slots.stream().map(this::toSlotResponse).toList()
            ));
        }
        return result;
    }

    @Transactional
    public MentorshipBookingResponse updateBooking(UUID bookingId, UpdateMentorshipBookingRequest request) {
        MentorshipBooking booking = findBooking(bookingId);
        if (request.status() != null && !request.status().isBlank()) {
            String status = normalizeStatusOrThrow(request.status());
            booking.setStatus(status);
            if ("cancelled".equals(status)) {
                booking.setCancelledAt(Instant.now());
            }
            if ("completed".equals(status)) {
                booking.setCompletedAt(Instant.now());
            }
        }
        if (request.notes() != null) {
            booking.setNotes(request.notes().isBlank() ? null : request.notes().trim());
        }
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse cancelBooking(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        if ("completed".equals(booking.getStatus()) || "refunded".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed or refunded booking");
        }
        booking.setStatus("cancelled");
        booking.setCancelledAt(Instant.now());
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse requestRefund(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        if (!Set.of("cancelled", "completed", "confirmed").contains(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refund only available for cancelled or completed bookings");
        }
        booking.setStatus("refund_requested");
        booking.setRefundStatus("requested");
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse approveRefund(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        if (!"refund_requested".equals(booking.getStatus()) && !"requested".equals(booking.getRefundStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending refund for this booking");
        }
        booking.setStatus("refunded");
        booking.setRefundStatus("approved");
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse rejectRefund(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        booking.setRefundStatus("rejected");
        if ("refund_requested".equals(booking.getStatus())) {
            booking.setStatus(booking.getCancelledAt() != null ? "cancelled" : "completed");
        }
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse confirmBooking(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        if (!"pending".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be confirmed");
        }
        booking.setStatus("confirmed");
        return toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse completeBooking(UUID bookingId) {
        MentorshipBooking booking = findBooking(bookingId);
        booking.setStatus("completed");
        booking.setCompletedAt(Instant.now());
        return toResponse(bookingRepository.save(booking));
    }

    private boolean isScheduled(MentorshipBooking booking) {
        return Set.of("pending", "confirmed").contains(booking.getStatus())
            && booking.getScheduledAt().isAfter(Instant.now().minusSeconds(3600));
    }

    private List<RevenueTrendPoint> buildRevenueTrend() {
        List<RevenueTrendPoint> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d").withLocale(Locale.US);
        Instant now = Instant.now();
        for (int i = 6; i >= 0; i--) {
            Instant dayStart = now.minusSeconds(i * 86400L);
            String label = fmt.format(dayStart.atZone(ZoneId.systemDefault()));
            long cents = bookingRepository.findAll().stream()
                .filter(b -> "completed".equals(b.getStatus()) || "confirmed".equals(b.getStatus()))
                .filter(b -> b.getScheduledAt().isAfter(dayStart.minusSeconds(86400))
                    && b.getScheduledAt().isBefore(dayStart.plusSeconds(86400 * 2)))
                .mapToLong(MentorshipBooking::getAmountCents)
                .sum();
            points.add(new RevenueTrendPoint(label, cents));
        }
        return points;
    }

    private MentorshipBooking findBooking(UUID id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private MentorshipBookingResponse toResponse(MentorshipBooking booking) {
        String requestType = booking.getRequestType() != null ? booking.getRequestType() : "mentorship";
        boolean upcoming = Set.of("pending", "confirmed").contains(booking.getStatus())
            && booking.getScheduledAt().isAfter(Instant.now());
        return new MentorshipBookingResponse(
            booking.getId(),
            booking.getBookingCode(),
            booking.getMentorId(),
            booking.getLearnerId(),
            booking.getMentorDisplayName(),
            booking.getLearnerDisplayName(),
            booking.getScheduledAt(),
            formatDate(booking.getScheduledAt()),
            formatDate(booking.getScheduledAt()),
            "UTC",
            booking.getDurationMinutes(),
            booking.getDurationMinutes() + " min",
            booking.getHourlyRateCents(),
            formatRate(booking.getHourlyRateCents()),
            booking.getAmountCents(),
            formatMoney(booking.getAmountCents()),
            booking.getStatus(),
            booking.getRefundStatus(),
            booking.getNotes(),
            requestType,
            requestType,
            booking.getRequestMessage() != null ? booking.getRequestMessage() : "",
            upcoming,
            booking.getCreatedAt(),
            booking.getCancelledAt(),
            booking.getCompletedAt()
        );
    }

    private AvailabilitySlotResponse toSlotResponse(MentorAvailabilitySlot slot) {
        int dow = slot.getDayOfWeek();
        String dayLabel = dow >= 0 && dow < DAY_LABELS.length ? DAY_LABELS[dow] : "Day " + dow;
        return new AvailabilitySlotResponse(
            slot.getId(),
            slot.getDayOfWeek(),
            dayLabel,
            slot.getStartTime(),
            slot.getEndTime(),
            slot.getTimezone(),
            slot.isActive()
        );
    }

    private String formatDate(Instant instant) {
        return DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)
            .format(instant.atZone(ZoneId.systemDefault()));
    }

    private String formatMoney(long cents) {
        return String.format(Locale.US, "$%.2f", cents / 100.0);
    }

    private String formatRate(int hourlyCents) {
        if (hourlyCents <= 0) {
            return "Free";
        }
        return String.format(Locale.US, "$%d/hr", hourlyCents / 100);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }
        return normalizeStatusOrThrow(status);
    }

    private String normalizeStatusOrThrow(String status) {
        String s = status.trim().toLowerCase(Locale.ROOT);
        if (!STATUSES.contains(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }
        return s;
    }

    private String normalizeQuery(String query) {
        return query != null && !query.isBlank() ? query.trim() : null;
    }
}
