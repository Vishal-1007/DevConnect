package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.BookingAnalyticsResponse.RevenueTrendPoint;
import com.developersconnect.mentor.dto.MentorAnalyticsResponse;
import com.developersconnect.mentor.dto.MentorAvailabilityResponse.AvailabilitySlotResponse;
import com.developersconnect.mentor.dto.MentorBookingReminderResponse;
import com.developersconnect.mentor.dto.MentorBookingsOverviewResponse;
import com.developersconnect.mentor.dto.MentorRecurringPlanResponse;
import com.developersconnect.mentor.dto.MentorDashboardResponse;
import com.developersconnect.mentor.dto.MentorEarningsResponse;
import com.developersconnect.mentor.dto.MentorMyAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorScheduleItemResponse;
import com.developersconnect.mentor.dto.MentorStudentResponse;
import com.developersconnect.mentor.dto.MentorPendingRequestResponse;
import com.developersconnect.mentor.dto.MentorStudentProgressHighlight;
import com.developersconnect.mentor.dto.MentorTopicProgressItem;
import com.developersconnect.mentor.dto.MentorStudentSummaryResponse;
import com.developersconnect.mentor.dto.MentorTopicPerformanceResponse;
import com.developersconnect.mentor.dto.MentorTransactionResponse;
import com.developersconnect.mentor.dto.CreateMentorWithdrawalRequest;
import com.developersconnect.mentor.dto.MentorPaymentAnalyticsResponse;
import com.developersconnect.mentor.dto.MentorPaymentBreakdownResponse;
import com.developersconnect.mentor.dto.MentorPayoutHistoryResponse;
import com.developersconnect.mentor.dto.MentorWithdrawalResponse;
import com.developersconnect.mentor.dto.MentorshipBookingResponse;
import com.developersconnect.mentor.dto.SaveMentorAvailabilityRequest;
import com.developersconnect.mentor.dto.SaveMentorAvailabilityRequest.AvailabilitySlotInput;
import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import com.developersconnect.mentor.model.MentorRecurringPlan;
import com.developersconnect.mentor.model.MentorReview;
import com.developersconnect.mentor.model.MentorStudentRoadmapItem;
import com.developersconnect.mentor.model.MentorWithdrawalRequest;
import com.developersconnect.mentor.repository.MentorRecurringPlanRepository;
import com.developersconnect.mentor.repository.MentorReviewRepository;
import com.developersconnect.mentor.repository.MentorStudentRoadmapItemRepository;
import com.developersconnect.mentor.repository.MentorWithdrawalRequestRepository;
import com.developersconnect.mentor.service.MentorStudentService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorWorkspaceService {

    private static final String[] DAY_LABELS = {
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    };

    private static final String[] TOPICS = {
        "System Design", "DSA", "React", "Backend", "Career", "Java", "DevOps"
    };

    private static final Set<String> STATUSES = Set.of(
        "pending", "confirmed", "completed", "cancelled", "refund_requested", "refunded"
    );

    private static final double COMMISSION_RATE_PCT = 10.0;

    private final MentorshipBookingRepository bookingRepository;
    private final MentorAvailabilitySlotRepository availabilityRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorProfileService mentorProfileService;
    private final MentorStudentService mentorStudentService;
    private final MentorRecurringPlanRepository recurringPlanRepository;
    private final MentorWithdrawalRequestRepository withdrawalRepository;
    private final MentorReviewRepository reviewRepository;
    private final MentorStudentRoadmapItemRepository roadmapRepository;

    public MentorWorkspaceService(
        MentorshipBookingRepository bookingRepository,
        MentorAvailabilitySlotRepository availabilityRepository,
        MentorProfileRepository mentorProfileRepository,
        MentorProfileService mentorProfileService,
        MentorStudentService mentorStudentService,
        MentorRecurringPlanRepository recurringPlanRepository,
        MentorWithdrawalRequestRepository withdrawalRepository,
        MentorReviewRepository reviewRepository,
        MentorStudentRoadmapItemRepository roadmapRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.availabilityRepository = availabilityRepository;
        this.mentorProfileRepository = mentorProfileRepository;
        this.mentorProfileService = mentorProfileService;
        this.mentorStudentService = mentorStudentService;
        this.recurringPlanRepository = recurringPlanRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.reviewRepository = reviewRepository;
        this.roadmapRepository = roadmapRepository;
    }

    @Transactional(readOnly = true)
    public MentorDashboardResponse getDashboard(UUID mentorId) {
        requireApprovedMentor(mentorId);
        MentorProfile profile = requireProfile(mentorId);

        long totalEarnings = bookingRepository.sumRevenueCentsByMentorId(mentorId);
        long sessionsCompleted = bookingRepository.countByMentorIdAndStatus(mentorId, "completed");
        long activeStudents = bookingRepository.countDistinctActiveStudents(mentorId);

        ZoneId zone = ZoneId.systemDefault();
        Instant monthStart = LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant nextMonth = LocalDate.now(zone).plusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant prevMonthStart = LocalDate.now(zone).minusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();

        long monthlyEarnings = bookingRepository.sumRevenueCentsByMentorIdBetween(mentorId, monthStart, nextMonth);
        long prevMonthlyEarnings = bookingRepository.sumRevenueCentsByMentorIdBetween(mentorId, prevMonthStart, monthStart);

        long monthlySessions = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(monthStart) && b.getScheduledAt().isBefore(nextMonth))
            .count();
        long prevMonthlySessions = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(prevMonthStart) && b.getScheduledAt().isBefore(monthStart))
            .count();

        List<MentorScheduleItemResponse> todaySchedule = buildTodaySchedule(mentorId, zone);
        List<MentorScheduleItemResponse> upcomingSessions = buildUpcomingSessions(mentorId, zone);
        List<MentorPendingRequestResponse> pendingRequests = buildPendingRequests(mentorId, zone, 5);
        List<MentorStudentSummaryResponse> topStudents = buildTopStudents(mentorId);
        List<RevenueTrendPoint> earningsTrend = buildRevenueTrend(mentorId);
        List<RevenueTrendPoint> sessionsTrend = buildSessionsTrend(mentorId);
        List<MentorStudentResponse> students = listStudents(mentorId);
        MentorStudentProgressHighlight highlightedStudent = buildHighlightedStudent(mentorId, students);
        List<String> aiSuggestions = buildAiSuggestions(students, upcomingSessions, profile);
        long pendingBookingCount = bookingRepository.countByMentorIdAndStatus(mentorId, "pending");
        long prevActiveStudents = countActiveStudentsBefore(mentorId, monthStart);
        String mentorRankLabel = resolveMentorRank(profile, sessionsCompleted);
        int responseTimeMinutes = computeResponseTimeMinutes(mentorId);
        int prevResponseTimeMinutes = computeResponseTimeMinutesBefore(mentorId, monthStart);
        double ratingGrowthPct = computeRatingGrowthPct(mentorId, profile.getAverageRating(), monthStart);

        return new MentorDashboardResponse(
            totalEarnings,
            formatMoney(totalEarnings),
            monthlyEarnings,
            formatMoney(monthlyEarnings),
            sessionsCompleted,
            activeStudents,
            profile.getAverageRating(),
            profile.getRatingCount(),
            computeCompletionRate(mentorId),
            responseTimeMinutes,
            growthPct(monthlyEarnings, prevMonthlyEarnings),
            growthPct(monthlySessions, prevMonthlySessions),
            growthPct(activeStudents, prevActiveStudents),
            pendingBookingCount,
            mentorRankLabel,
            todaySchedule,
            upcomingSessions,
            pendingRequests,
            topStudents,
            earningsTrend,
            sessionsTrend,
            ratingGrowthPct,
            growthPct(responseTimeMinutes, prevResponseTimeMinutes),
            aiSuggestions,
            highlightedStudent
        );
    }

    @Transactional(readOnly = true)
    public List<MentorStudentResponse> listStudents(UUID mentorId) {
        return mentorStudentService.listStudents(mentorId, null);
    }

    @Transactional(readOnly = true)
    public List<MentorshipBookingResponse> listBookings(UUID mentorId, String status, int limit) {
        requireApprovedMentor(mentorId);
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        String normalized = normalizeStatus(status);

        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, safeLimit))
            .stream()
            .filter(b -> matchesBookingFilter(b, normalized))
            .map(this::toBookingResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorBookingsOverviewResponse getBookingsOverview(UUID mentorId) {
        requireApprovedMentor(mentorId);
        MentorProfile profile = requireProfile(mentorId);
        ZoneId zone = resolveZone(profile);

        List<MentorshipBooking> bookings = bookingRepository.findByMentorIdOrderByScheduledAtDesc(
            mentorId,
            PageRequest.of(0, 200)
        );

        int confirmed = (int) bookings.stream().filter(b -> "confirmed".equals(b.getStatus())).count();
        int pending = (int) bookings.stream().filter(b -> "pending".equals(b.getStatus())).count();
        int completed = (int) bookings.stream().filter(b -> "completed".equals(b.getStatus())).count();
        int cancelled = (int) bookings.stream().filter(b -> "cancelled".equals(b.getStatus())).count();
        int upcoming = (int) bookings.stream().filter(b -> isUpcoming(b)).count();

        Instant now = Instant.now();
        List<MentorBookingReminderResponse> reminders = bookings.stream()
            .filter(b -> isUpcoming(b))
            .filter(b -> b.getScheduledAt().isAfter(now) && b.getScheduledAt().isBefore(now.plus(24, ChronoUnit.HOURS)))
            .sorted(Comparator.comparing(MentorshipBooking::getScheduledAt))
            .map(b -> toReminder(b, zone, now))
            .toList();

        List<MentorRecurringPlanResponse> recurringPlans = recurringPlanRepository
            .findByMentorIdOrderByCreatedAtDesc(mentorId)
            .stream()
            .map(p -> toRecurringPlanResponse(p, zone))
            .toList();

        return new MentorBookingsOverviewResponse(
            confirmed,
            pending,
            completed,
            cancelled,
            upcoming,
            zone.getId(),
            reminders,
            recurringPlans
        );
    }

    @Transactional(readOnly = true)
    public List<MentorPendingRequestResponse> listSessionRequests(UUID mentorId) {
        requireApprovedMentor(mentorId);
        ZoneId zone = ZoneId.systemDefault();
        return buildPendingRequests(mentorId, zone, 50);
    }

    @Transactional
    public MentorshipBookingResponse rescheduleBooking(
        UUID mentorId,
        UUID bookingId,
        com.developersconnect.mentor.dto.RescheduleMentorBookingRequest request
    ) {
        MentorshipBooking booking = requireOwnedBooking(mentorId, bookingId);
        if (!"pending".equals(booking.getStatus()) && !"confirmed".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending or confirmed bookings can be rescheduled");
        }
        booking.setScheduledAt(request.scheduledAt());
        if (request.confirmImmediately()) {
            booking.setStatus("confirmed");
        }
        return toBookingResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse confirmBooking(UUID mentorId, UUID bookingId) {
        MentorshipBooking booking = requireOwnedBooking(mentorId, bookingId);
        if (!"pending".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be confirmed");
        }
        booking.setStatus("confirmed");
        return toBookingResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse completeBooking(UUID mentorId, UUID bookingId) {
        MentorshipBooking booking = requireOwnedBooking(mentorId, bookingId);
        booking.setStatus("completed");
        booking.setCompletedAt(Instant.now());
        return toBookingResponse(bookingRepository.save(booking));
    }

    @Transactional
    public MentorshipBookingResponse cancelBooking(UUID mentorId, UUID bookingId) {
        MentorshipBooking booking = requireOwnedBooking(mentorId, bookingId);
        if ("completed".equals(booking.getStatus()) || "refunded".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed or refunded booking");
        }
        booking.setStatus("cancelled");
        booking.setCancelledAt(Instant.now());
        return toBookingResponse(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public MentorMyAvailabilityResponse getAvailability(UUID mentorId) {
        requireApprovedMentor(mentorId);
        MentorProfile profile = requireProfile(mentorId);
        List<AvailabilitySlotResponse> slots = availabilityRepository
            .findAllByMentorIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(mentorId)
            .stream()
            .map(this::toSlotResponse)
            .toList();
        return new MentorMyAvailabilityResponse(
            profile.isVacationMode(),
            profile.isAvailable() && !profile.isVacationMode() && !slots.isEmpty(),
            profile.isAutoSchedulingEnabled(),
            profile.getAvailabilityTimezone(),
            buildWorkingHoursSummary(slots),
            slots
        );
    }

    @Transactional
    public MentorMyAvailabilityResponse saveAvailability(UUID mentorId, SaveMentorAvailabilityRequest request) {
        requireApprovedMentor(mentorId);
        MentorProfile profile = requireProfile(mentorId);
        profile.setVacationMode(request.vacationMode());
        profile.setAutoSchedulingEnabled(request.autoSchedulingEnabled());
        if (request.timezone() != null && !request.timezone().isBlank()) {
            profile.setAvailabilityTimezone(request.timezone().trim());
        }

        availabilityRepository.deleteByMentorId(mentorId);
        String timezone = profile.getAvailabilityTimezone();
        boolean hasSlots = false;
        if (!request.vacationMode() && request.slots() != null) {
            for (AvailabilitySlotInput slot : request.slots()) {
                MentorAvailabilitySlot entity = new MentorAvailabilitySlot();
                entity.setMentorId(mentorId);
                entity.setDayOfWeek(slot.dayOfWeek());
                entity.setStartTime(slot.startTime());
                entity.setEndTime(slot.endTime());
                entity.setTimezone(timezone);
                entity.setActive(true);
                availabilityRepository.save(entity);
                hasSlots = true;
            }
        }

        profile.setAvailable(!request.vacationMode() && hasSlots);
        mentorProfileRepository.save(profile);

        return getAvailability(mentorId);
    }

    @Transactional(readOnly = true)
    public MentorEarningsResponse getEarnings(UUID mentorId) {
        requireApprovedMentor(mentorId);
        long total = bookingRepository.sumRevenueCentsByMentorId(mentorId);

        ZoneId zone = ZoneId.systemDefault();
        Instant monthStart = LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant nextMonth = LocalDate.now(zone).plusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant prevMonthStart = LocalDate.now(zone).minusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();

        long monthly = bookingRepository.sumRevenueCentsByMentorIdBetween(mentorId, monthStart, nextMonth);
        long prevMonthly = bookingRepository.sumRevenueCentsByMentorIdBetween(mentorId, prevMonthStart, monthStart);
        long sessionRevenue = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(monthStart) && b.getScheduledAt().isBefore(nextMonth))
            .mapToLong(MentorshipBooking::getAmountCents)
            .sum();
        long pending = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> "confirmed".equals(b.getStatus()))
            .mapToLong(MentorshipBooking::getAmountCents)
            .sum();
        long pendingWithdrawals = withdrawalRepository.sumAmountCentsByMentorIdAndStatus(mentorId, "pending");
        long availableBalance = Math.max(0, pending - pendingWithdrawals);
        long platformFee = Math.round(total * (COMMISSION_RATE_PCT / 100.0));
        long netEarnings = Math.max(0, total - platformFee);

        List<MentorTransactionResponse> transactions = bookingRepository
            .findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 20))
            .stream()
            .filter(b -> Set.of("confirmed", "completed", "pending").contains(b.getStatus()))
            .map(b -> new MentorTransactionResponse(
                b.getId(),
                b.getBookingCode(),
                sessionTitle(b),
                b.getAmountCents(),
                formatMoney(b.getAmountCents()),
                b.getScheduledAt(),
                formatDate(b.getScheduledAt()),
                mapTxnStatus(b.getStatus())
            ))
            .toList();

        List<MentorWithdrawalResponse> withdrawals = withdrawalRepository
            .findAllByMentorIdOrderByRequestedAtDesc(mentorId)
            .stream()
            .map(this::toWithdrawalResponse)
            .toList();

        List<MentorPayoutHistoryResponse> payoutHistory = buildPayoutHistory(mentorId, withdrawals);
        MentorPaymentAnalyticsResponse paymentAnalytics = buildPaymentAnalytics(
            mentorId, sessionRevenue, total, netEarnings, availableBalance
        );

        return new MentorEarningsResponse(
            total,
            formatMoney(total),
            monthly,
            formatMoney(monthly),
            sessionRevenue,
            formatMoney(sessionRevenue),
            pending,
            formatMoney(pending),
            platformFee,
            formatMoney(platformFee),
            COMMISSION_RATE_PCT,
            netEarnings,
            formatMoney(netEarnings),
            growthPct(monthly, prevMonthly),
            buildRevenueTrend(mentorId),
            transactions,
            payoutHistory,
            withdrawals,
            paymentAnalytics
        );
    }

    @Transactional
    public MentorWithdrawalResponse requestWithdrawal(UUID mentorId, CreateMentorWithdrawalRequest request) {
        requireApprovedMentor(mentorId);
        long pending = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> "confirmed".equals(b.getStatus()))
            .mapToLong(MentorshipBooking::getAmountCents)
            .sum();
        long pendingWithdrawals = withdrawalRepository.sumAmountCentsByMentorIdAndStatus(mentorId, "pending");
        long available = Math.max(0, pending - pendingWithdrawals);

        if (request.amountCents() > available) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Withdrawal amount exceeds available balance of " + formatMoney(available)
            );
        }

        MentorWithdrawalRequest withdrawal = new MentorWithdrawalRequest();
        withdrawal.setWithdrawalCode(generateWithdrawalCode());
        withdrawal.setMentorId(mentorId);
        withdrawal.setAmountCents(request.amountCents());
        withdrawal.setStatus("pending");
        withdrawal.setNote(trimToNull(request.note()));
        return toWithdrawalResponse(withdrawalRepository.save(withdrawal));
    }

    @Transactional(readOnly = true)
    public MentorAnalyticsResponse getAnalytics(UUID mentorId) {
        requireApprovedMentor(mentorId);
        MentorProfile profile = requireProfile(mentorId);

        ZoneId zone = ZoneId.systemDefault();
        Instant monthStart = LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant nextMonth = LocalDate.now(zone).plusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant prevMonthStart = LocalDate.now(zone).minusMonths(1).withDayOfMonth(1).atStartOfDay(zone).toInstant();

        long completed = bookingRepository.countByMentorIdAndStatus(mentorId, "completed");
        long cancelled = bookingRepository.countByMentorIdAndStatus(mentorId, "cancelled");
        long total = completed + cancelled + bookingRepository.countByMentorIdAndStatus(mentorId, "confirmed")
            + bookingRepository.countByMentorIdAndStatus(mentorId, "pending");

        long monthlyCompleted = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(monthStart) && b.getScheduledAt().isBefore(nextMonth))
            .count();
        long prevMonthlyCompleted = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(prevMonthStart) && b.getScheduledAt().isBefore(monthStart))
            .count();

        double completionRate = computeCompletionRate(mentorId);
        double prevCompletionRate = computeCompletionRateBefore(mentorId, monthStart);
        int avgDuration = averageDurationMinutes(mentorId);
        int prevAvgDuration = averageDurationMinutesBefore(mentorId, monthStart);
        double retention = computeRetention(mentorId);
        double prevRetention = computeRetentionBefore(mentorId, monthStart);
        long repeatStudents = countRepeatStudents(mentorId);
        int responseTime = computeResponseTimeMinutes(mentorId);

        List<Integer> sessionsByMonth = buildSessionsByMonth(mentorId);
        List<MentorTopicPerformanceResponse> topicPerformance = buildTopicPerformance(mentorId);
        List<String> teachingTips = buildTeachingTips(
            profile, completionRate, retention, responseTime, avgDuration, profile.getAverageRating()
        );

        return new MentorAnalyticsResponse(
            completed,
            growthPct(monthlyCompleted, prevMonthlyCompleted),
            completionRate,
            completionRate - prevCompletionRate,
            avgDuration,
            prevAvgDuration == 0 ? 0 : growthPct(avgDuration, prevAvgDuration),
            retention,
            retention - prevRetention,
            profile.getAverageRating(),
            countFiveStarSessions(mentorId, profile.getAverageRating(), completed),
            repeatStudents,
            responseTime,
            total == 0 ? 0 : Math.round((cancelled * 100.0) / total * 10) / 10.0,
            sessionsByMonth,
            topicPerformance,
            teachingTips
        );
    }

    private void requireApprovedMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }
    }

    private MentorProfile requireProfile(UUID mentorId) {
        return mentorProfileRepository.findById(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
    }

    private MentorshipBooking requireOwnedBooking(UUID mentorId, UUID bookingId) {
        requireApprovedMentor(mentorId);
        MentorshipBooking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (!mentorId.equals(booking.getMentorId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Booking does not belong to this mentor");
        }
        return booking;
    }

    private List<MentorScheduleItemResponse> buildUpcomingSessions(UUID mentorId, ZoneId zone) {
        Instant now = Instant.now();
        Instant horizon = now.plus(7, ChronoUnit.DAYS);
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("EEE h:mm a", Locale.US);

        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> Set.of("pending", "confirmed").contains(b.getStatus()))
            .filter(b -> !b.getScheduledAt().isBefore(now.minus(1, ChronoUnit.HOURS)))
            .filter(b -> b.getScheduledAt().isBefore(horizon))
            .sorted(Comparator.comparing(MentorshipBooking::getScheduledAt))
            .limit(6)
            .map(b -> new MentorScheduleItemResponse(
                b.getId(),
                dayFmt.format(b.getScheduledAt().atZone(zone)),
                sessionTitle(b),
                b.getLearnerDisplayName(),
                mapScheduleStatus(b)
            ))
            .toList();
    }

    private List<MentorPendingRequestResponse> buildPendingRequests(UUID mentorId, ZoneId zone, int limit) {
        DateTimeFormatter requestedFmt = DateTimeFormatter.ofPattern("MMM d, h:mm a", Locale.US);
        DateTimeFormatter scheduledFmt = DateTimeFormatter.ofPattern("EEE, MMM d · h:mm a", Locale.US);
        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> "pending".equals(b.getStatus()))
            .sorted(Comparator
                .comparing(MentorshipBooking::isPremiumLearner).reversed()
                .thenComparing(MentorshipBooking::getCreatedAt, Comparator.reverseOrder()))
            .limit(limit)
            .map(b -> {
                String type = resolveRequestType(b);
                return new MentorPendingRequestResponse(
                    b.getId(),
                    b.getBookingCode(),
                    b.getLearnerId(),
                    b.getLearnerDisplayName(),
                    type,
                    requestTypeLabel(type),
                    sessionTitle(b),
                    resolveRequestMessage(b),
                    b.isPremiumLearner(),
                    b.isPremiumLearner() ? 100 : 50,
                    requestedFmt.format(b.getCreatedAt().atZone(zone)),
                    b.getCreatedAt(),
                    scheduledFmt.format(b.getScheduledAt().atZone(zone)),
                    b.getScheduledAt(),
                    b.getDurationMinutes(),
                    formatMoney(b.getAmountCents())
                );
            })
            .toList();
    }

    private String resolveRequestType(MentorshipBooking booking) {
        if (booking.getRequestType() != null && !booking.getRequestType().isBlank()) {
            return booking.getRequestType();
        }
        String notes = booking.getNotes() != null ? booking.getNotes().toLowerCase(Locale.US) : "";
        if (notes.contains("mock interview") || notes.contains("interview prep")) {
            return "mock-interview";
        }
        if (notes.contains("career")) {
            return "career-guidance";
        }
        if (notes.contains("code review") || notes.contains("review")) {
            return "code-review";
        }
        if (notes.contains("system design")) {
            return "system-design";
        }
        return "project-help";
    }

    private String requestTypeLabel(String type) {
        return switch (type) {
            case "mock-interview" -> "Mock Interview";
            case "career-guidance" -> "Career Guidance";
            case "code-review" -> "Code Review";
            case "system-design" -> "System Design";
            default -> "Project Help";
        };
    }

    private String resolveRequestMessage(MentorshipBooking booking) {
        if (booking.getRequestMessage() != null && !booking.getRequestMessage().isBlank()) {
            return booking.getRequestMessage().trim();
        }
        if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
            return booking.getNotes().trim();
        }
        return "Learner requested a mentorship session.";
    }

    private MentorStudentProgressHighlight buildHighlightedStudent(UUID mentorId, List<MentorStudentResponse> students) {
        if (students.isEmpty()) {
            return null;
        }
        MentorStudentResponse top = students.stream()
            .max(Comparator.comparingInt(MentorStudentResponse::progressPct))
            .orElse(students.get(0));

        List<MentorTopicProgressItem> topics = roadmapRepository
            .findByMentorIdAndLearnerIdOrderBySortOrderAsc(mentorId, top.learnerId())
            .stream()
            .limit(4)
            .map(this::toTopicProgress)
            .toList();

        if (topics.isEmpty()) {
            topics = List.of(
                new MentorTopicProgressItem(top.strongArea(), Math.min(100, top.progressPct())),
                new MentorTopicProgressItem(top.weakArea(), Math.max(0, top.progressPct() - 10)),
                new MentorTopicProgressItem("Interview Readiness", top.interviewReadinessPct())
            );
        }

        return new MentorStudentProgressHighlight(
            top.learnerId(),
            top.name(),
            top.progressPct(),
            topics
        );
    }

    private MentorTopicProgressItem toTopicProgress(MentorStudentRoadmapItem item) {
        int pct = switch (item.getStatus() != null ? item.getStatus().toLowerCase(Locale.US) : "active") {
            case "completed" -> 100;
            case "active" -> 60;
            default -> 25;
        };
        return new MentorTopicProgressItem(item.getTitle(), pct);
    }

    private List<String> buildAiSuggestions(
        List<MentorStudentResponse> students,
        List<MentorScheduleItemResponse> upcoming,
        MentorProfile profile
    ) {
        List<String> suggestions = new ArrayList<>();
        if (!upcoming.isEmpty()) {
            MentorScheduleItemResponse next = upcoming.get(0);
            suggestions.add("Prepare talking points for " + next.title() + " with " + next.studentName() + ".");
        }
        if (!students.isEmpty()) {
            MentorStudentResponse top = students.get(0);
            if (top.weakArea() != null && !top.weakArea().isBlank()) {
                suggestions.add("Review " + top.weakArea() + " fundamentals — " + top.name() + " needs support in this area.");
            }
            if (top.strongArea() != null && !top.strongArea().isBlank()) {
                suggestions.add("Celebrate progress in " + top.strongArea() + " and assign a stretch goal for next session.");
            }
            if (top.pendingTaskCount() > 0) {
                suggestions.add(top.name() + " has " + top.pendingTaskCount() + " open task"
                    + (top.pendingTaskCount() == 1 ? "" : "s") + " — review them in the next session.");
            }
        }
        if (profile.getAverageRating() < 4.5 && profile.getRatingCount() > 0) {
            suggestions.add("Send a follow-up summary after sessions — mentors with recap notes improve ratings.");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Accept session requests and complete bookings to unlock personalized coaching tips.");
        }
        return suggestions.stream().limit(4).toList();
    }

    private String resolveMentorRank(MentorProfile profile, long sessionsCompleted) {
        if (profile.getAverageRating() >= 4.8 && sessionsCompleted >= 20) {
            return "Top 1% Mentor";
        }
        if (profile.getAverageRating() >= 4.5 || sessionsCompleted >= 10) {
            return "Top 5% Mentor";
        }
        if (sessionsCompleted >= 3) {
            return "Rising Mentor";
        }
        return "New Mentor";
    }

    private List<MentorScheduleItemResponse> buildTodaySchedule(UUID mentorId, ZoneId zone) {
        LocalDate today = LocalDate.now(zone);
        Instant start = today.atStartOfDay(zone).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(zone).toInstant();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("h:mm a", Locale.US);

        return bookingRepository.findByMentorIdAndScheduledAtBetweenOrderByScheduledAtAsc(mentorId, start, end)
            .stream()
            .filter(b -> !Set.of("cancelled", "refunded").contains(b.getStatus()))
            .map(b -> {
                String status = mapScheduleStatus(b);
                return new MentorScheduleItemResponse(
                    b.getId(),
                    timeFmt.format(b.getScheduledAt().atZone(zone)),
                    sessionTitle(b),
                    b.getLearnerDisplayName(),
                    status
                );
            })
            .toList();
    }

    private List<MentorStudentSummaryResponse> buildTopStudents(UUID mentorId) {
        return listStudents(mentorId).stream()
            .sorted(Comparator.comparingInt(MentorStudentResponse::progressPct).reversed()
                .thenComparing(Comparator.comparingInt(MentorStudentResponse::sessions).reversed()))
            .limit(4)
            .map(s -> new MentorStudentSummaryResponse(
                s.learnerId(),
                s.name(),
                s.sessions(),
                learnerRating(mentorId, s.learnerId()),
                s.progressPct()
            ))
            .toList();
    }

    private double learnerRating(UUID mentorId, UUID learnerId) {
        return reviewRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .map(MentorReview::getRating)
            .map(Integer::doubleValue)
            .orElse(0.0);
    }

    private List<RevenueTrendPoint> buildSessionsTrend(UUID mentorId) {
        List<RevenueTrendPoint> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d").withLocale(Locale.US);
        ZoneId zone = ZoneId.systemDefault();
        Instant now = Instant.now();

        for (int i = 6; i >= 0; i--) {
            Instant dayStart = now.minus(i, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
            Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);
            long count = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
                .stream()
                .filter(b -> "completed".equals(b.getStatus()))
                .filter(b -> !b.getScheduledAt().isBefore(dayStart) && b.getScheduledAt().isBefore(dayEnd))
                .count();
            points.add(new RevenueTrendPoint(fmt.format(dayStart.atZone(zone)), count));
        }
        return points;
    }

    private long countActiveStudentsBefore(UUID mentorId, Instant before) {
        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> Set.of("pending", "confirmed", "completed").contains(b.getStatus()))
            .filter(b -> b.getScheduledAt().isBefore(before))
            .map(MentorshipBooking::getLearnerId)
            .distinct()
            .count();
    }

    private double computeRatingGrowthPct(UUID mentorId, double currentRating, Instant monthStart) {
        List<MentorReview> recent = reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId).stream()
            .filter(r -> r.getCreatedAt() != null && !r.getCreatedAt().isBefore(monthStart))
            .toList();
        List<MentorReview> prior = reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId).stream()
            .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isBefore(monthStart))
            .toList();
        if (recent.isEmpty() || prior.isEmpty()) {
            return 0;
        }
        double recentAvg = recent.stream().mapToInt(MentorReview::getRating).average().orElse(currentRating);
        double priorAvg = prior.stream().mapToInt(MentorReview::getRating).average().orElse(currentRating);
        if (priorAvg == 0) {
            return recentAvg > 0 ? 100.0 : 0.0;
        }
        return Math.round(((recentAvg - priorAvg) * 100.0 / priorAvg) * 10) / 10.0;
    }

    private List<RevenueTrendPoint> buildRevenueTrend(UUID mentorId) {
        List<RevenueTrendPoint> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d").withLocale(Locale.US);
        ZoneId zone = ZoneId.systemDefault();
        Instant now = Instant.now();

        for (int i = 6; i >= 0; i--) {
            Instant dayStart = now.minus(i, ChronoUnit.DAYS).truncatedTo(ChronoUnit.DAYS);
            Instant dayEnd = dayStart.plus(1, ChronoUnit.DAYS);
            long cents = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
                .stream()
                .filter(b -> Set.of("confirmed", "completed").contains(b.getStatus()))
                .filter(b -> !b.getScheduledAt().isBefore(dayStart) && b.getScheduledAt().isBefore(dayEnd))
                .mapToLong(MentorshipBooking::getAmountCents)
                .sum();
            points.add(new RevenueTrendPoint(fmt.format(dayStart.atZone(zone)), cents));
        }
        return points;
    }

    private List<Integer> buildSessionsByMonth(UUID mentorId) {
        List<Integer> months = new ArrayList<>();
        ZoneId zone = ZoneId.systemDefault();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = LocalDate.now(zone).minusMonths(i).withDayOfMonth(1);
            Instant since = month.atStartOfDay(zone).toInstant();
            Instant until = month.plusMonths(1).atStartOfDay(zone).toInstant();
            int count = (int) bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
                .stream()
                .filter(b -> "completed".equals(b.getStatus()))
                .filter(b -> !b.getScheduledAt().isBefore(since) && b.getScheduledAt().isBefore(until))
                .count();
            months.add(count);
        }
        return months;
    }

    private List<MentorTopicPerformanceResponse> buildTopicPerformance(UUID mentorId) {
        int base = (int) bookingRepository.countByMentorIdAndStatus(mentorId, "completed");
        List<MentorTopicPerformanceResponse> topics = new ArrayList<>();
        for (int i = 0; i < TOPICS.length; i++) {
            int score = Math.min(98, 55 + base * 3 + (i * 7));
            topics.add(new MentorTopicPerformanceResponse(TOPICS[i], score));
        }
        return topics;
    }

    private double computeCompletionRate(UUID mentorId) {
        long completed = bookingRepository.countByMentorIdAndStatus(mentorId, "completed");
        long cancelled = bookingRepository.countByMentorIdAndStatus(mentorId, "cancelled");
        long denominator = completed + cancelled;
        if (denominator == 0) {
            return 0;
        }
        return Math.round((completed * 100.0 / denominator) * 10) / 10.0;
    }

    private int averageDurationMinutes(UUID mentorId) {
        return (int) bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .mapToInt(MentorshipBooking::getDurationMinutes)
            .average()
            .orElse(60);
    }

    private double computeRetention(UUID mentorId) {
        Map<UUID, Long> counts = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .collect(Collectors.groupingBy(MentorshipBooking::getLearnerId, Collectors.counting()));
        if (counts.isEmpty()) {
            return 0;
        }
        long returning = counts.values().stream().filter(c -> c > 1).count();
        return Math.round((returning * 100.0 / counts.size()) * 10) / 10.0;
    }

    private long countRepeatStudents(UUID mentorId) {
        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .collect(Collectors.groupingBy(MentorshipBooking::getLearnerId, Collectors.counting()))
            .values()
            .stream()
            .filter(c -> c > 1)
            .count();
    }

    private String mapScheduleStatus(MentorshipBooking booking) {
        Instant now = Instant.now();
        Instant end = booking.getScheduledAt().plus(booking.getDurationMinutes(), ChronoUnit.MINUTES);
        if ("confirmed".equals(booking.getStatus()) && !now.isBefore(booking.getScheduledAt()) && now.isBefore(end)) {
            return "live";
        }
        if ("pending".equals(booking.getStatus()) || "confirmed".equals(booking.getStatus())) {
            return "upcoming";
        }
        return booking.getStatus();
    }

    private String sessionTitle(MentorshipBooking booking) {
        if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
            return booking.getNotes().trim();
        }
        return "Mentorship Session · " + booking.getDurationMinutes() + " min";
    }

    private String mapTxnStatus(String status) {
        return switch (status) {
            case "completed" -> "Completed";
            case "confirmed" -> "Pending";
            case "pending" -> "Pending";
            default -> status;
        };
    }

    private MentorshipBookingResponse toBookingResponse(MentorshipBooking booking) {
        MentorProfile profile = mentorProfileRepository.findById(booking.getMentorId()).orElse(null);
        ZoneId zone = resolveZone(profile);
        String requestType = resolveRequestType(booking);
        return new MentorshipBookingResponse(
            booking.getId(),
            booking.getBookingCode(),
            booking.getMentorId(),
            booking.getLearnerId(),
            booking.getMentorDisplayName(),
            booking.getLearnerDisplayName(),
            booking.getScheduledAt(),
            formatDateInZone(booking.getScheduledAt(), zone),
            formatTimeInZone(booking.getScheduledAt(), zone),
            zone.getId(),
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
            requestTypeLabel(requestType),
            resolveRequestMessage(booking),
            isUpcoming(booking),
            booking.getCreatedAt(),
            booking.getCancelledAt(),
            booking.getCompletedAt()
        );
    }

    private MentorBookingReminderResponse toReminder(MentorshipBooking booking, ZoneId zone, Instant now) {
        long minutes = Duration.between(now, booking.getScheduledAt()).toMinutes();
        String reminderLabel = minutes <= 60
            ? "Starting in " + minutes + " min"
            : minutes <= 1440
                ? "Today at " + formatTimeInZone(booking.getScheduledAt(), zone)
                : formatDateInZone(booking.getScheduledAt(), zone);
        return new MentorBookingReminderResponse(
            booking.getId(),
            booking.getBookingCode(),
            sessionTitle(booking),
            booking.getLearnerDisplayName(),
            booking.getScheduledAt(),
            formatDateInZone(booking.getScheduledAt(), zone) + " · " + formatTimeInZone(booking.getScheduledAt(), zone),
            reminderLabel,
            minutes
        );
    }

    private MentorRecurringPlanResponse toRecurringPlanResponse(MentorRecurringPlan plan, ZoneId zone) {
        int dow = plan.getDayOfWeek();
        String dayLabel = dow >= 0 && dow < DAY_LABELS.length ? DAY_LABELS[dow] : "Day " + dow;
        String freqLabel = switch (plan.getFrequency()) {
            case "biweekly" -> "Every 2 weeks";
            case "monthly" -> "Monthly";
            default -> "Weekly";
        };
        String nextLabel = plan.getNextSessionAt() == null
            ? "Not scheduled"
            : formatDateInZone(plan.getNextSessionAt(), zone) + " · " + formatTimeInZone(plan.getNextSessionAt(), zone);
        return new MentorRecurringPlanResponse(
            plan.getId(),
            plan.getLearnerId(),
            plan.getLearnerName(),
            plan.getTitle(),
            plan.getFrequency(),
            freqLabel,
            plan.getDayOfWeek(),
            dayLabel,
            plan.getStartTime(),
            plan.getDurationMinutes(),
            plan.getDurationMinutes() + " min",
            plan.getStatus(),
            plan.getNextSessionAt(),
            nextLabel
        );
    }

    private boolean matchesBookingFilter(MentorshipBooking booking, String normalized) {
        if (normalized == null) {
            return true;
        }
        if ("upcoming".equals(normalized)) {
            return isUpcoming(booking);
        }
        return normalized.equals(booking.getStatus());
    }

    private boolean isUpcoming(MentorshipBooking booking) {
        return Set.of("pending", "confirmed").contains(booking.getStatus())
            && booking.getScheduledAt().isAfter(Instant.now());
    }

    private ZoneId resolveZone(MentorProfile profile) {
        if (profile != null && profile.getAvailabilityTimezone() != null && !profile.getAvailabilityTimezone().isBlank()) {
            try {
                return ZoneId.of(profile.getAvailabilityTimezone());
            } catch (Exception ignored) {
                // fall through
            }
        }
        return ZoneId.systemDefault();
    }

    private String buildWorkingHoursSummary(List<AvailabilitySlotResponse> slots) {
        if (slots.isEmpty()) {
            return "No hours set";
        }
        Map<String, List<String>> byRange = new LinkedHashMap<>();
        for (AvailabilitySlotResponse slot : slots) {
            String key = slot.startTime() + "–" + slot.endTime();
            byRange.computeIfAbsent(key, k -> new ArrayList<>()).add(slot.dayLabel().substring(0, 3));
        }
        return byRange.entrySet().stream()
            .map(e -> String.join(", ", e.getValue()) + " · " + e.getKey())
            .collect(Collectors.joining(" · "));
    }

    private String formatTimeInZone(Instant instant, ZoneId zone) {
        return instant.atZone(zone).format(DateTimeFormatter.ofPattern("h:mm a", Locale.US));
    }

    private String formatDateInZone(Instant instant, ZoneId zone) {
        return instant.atZone(zone).format(DateTimeFormatter.ofPattern("EEE, MMM d", Locale.US));
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

    private double growthPct(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return Math.round(((current - previous) * 100.0 / previous) * 10) / 10.0;
    }

    private String formatDate(Instant instant) {
        return DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)
            .format(instant.atZone(ZoneId.systemDefault()));
    }

    private String formatRelative(Instant instant) {
        if (instant == null) {
            return "Never";
        }
        long days = Duration.between(instant, Instant.now()).toDays();
        if (days <= 0) {
            return "Today";
        }
        if (days == 1) {
            return "1 day ago";
        }
        return days + " days ago";
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
        String s = status.trim().toLowerCase(Locale.ROOT);
        if ("upcoming".equals(s)) {
            return s;
        }
        if (!STATUSES.contains(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }
        return s;
    }

    private MentorWithdrawalResponse toWithdrawalResponse(MentorWithdrawalRequest withdrawal) {
        return new MentorWithdrawalResponse(
            withdrawal.getId(),
            withdrawal.getWithdrawalCode(),
            withdrawal.getAmountCents(),
            formatMoney(withdrawal.getAmountCents()),
            capitalize(withdrawal.getStatus()),
            withdrawal.getNote(),
            withdrawal.getRequestedAt(),
            withdrawal.getProcessedAt(),
            formatDate(withdrawal.getRequestedAt())
        );
    }

    private List<MentorPayoutHistoryResponse> buildPayoutHistory(
        UUID mentorId,
        List<MentorWithdrawalResponse> withdrawals
    ) {
        List<MentorPayoutHistoryResponse> history = new ArrayList<>();
        for (MentorWithdrawalResponse withdrawal : withdrawals) {
            if ("Completed".equalsIgnoreCase(withdrawal.status())) {
                history.add(new MentorPayoutHistoryResponse(
                    withdrawal.id(),
                    withdrawal.withdrawalCode(),
                    withdrawal.amountCents(),
                    withdrawal.amountLabel(),
                    withdrawal.status(),
                    "Bank Transfer",
                    withdrawal.requestedAt(),
                    withdrawal.processedAt(),
                    withdrawal.dateLabel()
                ));
            }
        }
        bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 100))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .limit(5)
            .forEach(b -> history.add(new MentorPayoutHistoryResponse(
                b.getId(),
                "PO-" + b.getBookingCode(),
                b.getAmountCents(),
                formatMoney(b.getAmountCents()),
                "Completed",
                "Session Revenue",
                b.getCompletedAt() != null ? b.getCompletedAt() : b.getScheduledAt(),
                b.getCompletedAt(),
                formatDate(b.getCompletedAt() != null ? b.getCompletedAt() : b.getScheduledAt())
            )));
        return history.stream()
            .sorted(Comparator.comparing(MentorPayoutHistoryResponse::createdAt).reversed())
            .limit(10)
            .toList();
    }

    private MentorPaymentAnalyticsResponse buildPaymentAnalytics(
        UUID mentorId,
        long sessionRevenue,
        long total,
        long netEarnings,
        long availableBalance
    ) {
        Map<String, Long> byCategory = new LinkedHashMap<>();
        Map<String, Long> counts = new LinkedHashMap<>();
        bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> Set.of("completed", "confirmed").contains(b.getStatus()))
            .forEach(b -> {
                String category = resolveSessionCategory(b);
                byCategory.merge(category, (long) b.getAmountCents(), Long::sum);
                counts.merge(category, 1L, Long::sum);
            });

        List<MentorPaymentBreakdownResponse> breakdown = byCategory.entrySet().stream()
            .map(e -> new MentorPaymentBreakdownResponse(
                e.getKey(),
                e.getValue(),
                formatMoney(e.getValue()),
                counts.getOrDefault(e.getKey(), 0L),
                total == 0 ? 0 : Math.round((e.getValue() * 100.0 / total) * 10) / 10.0
            ))
            .toList();

        return new MentorPaymentAnalyticsResponse(
            sessionRevenue,
            formatMoney(sessionRevenue),
            COMMISSION_RATE_PCT,
            netEarnings,
            formatMoney(netEarnings),
            availableBalance,
            formatMoney(availableBalance),
            breakdown
        );
    }

    private String resolveSessionCategory(MentorshipBooking booking) {
        if (booking.getRequestType() != null && !booking.getRequestType().isBlank()) {
            return requestTypeLabel(booking.getRequestType());
        }
        if (booking.getNotes() != null) {
            String notes = booking.getNotes().toLowerCase(Locale.ROOT);
            if (notes.contains("system design")) return "System Design";
            if (notes.contains("dsa") || notes.contains("interview")) return "Interview Prep";
            if (notes.contains("react") || notes.contains("frontend")) return "Frontend";
            if (notes.contains("career")) return "Career";
        }
        return "Mentorship Sessions";
    }

    private int computeResponseTimeMinutes(UUID mentorId) {
        List<MentorshipBooking> pendingConfirmed = bookingRepository
            .findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 100))
            .stream()
            .filter(b -> Set.of("confirmed", "completed").contains(b.getStatus()))
            .filter(b -> b.getUpdatedAt() != null && b.getCreatedAt() != null)
            .toList();
        if (pendingConfirmed.isEmpty()) {
            return 0;
        }
        return (int) Math.round(pendingConfirmed.stream()
            .mapToLong(b -> Duration.between(b.getCreatedAt(), b.getUpdatedAt()).toMinutes())
            .average()
            .orElse(0));
    }

    private int computeResponseTimeMinutesBefore(UUID mentorId, Instant before) {
        List<MentorshipBooking> bookings = bookingRepository
            .findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 100))
            .stream()
            .filter(b -> Set.of("confirmed", "completed").contains(b.getStatus()))
            .filter(b -> b.getUpdatedAt() != null && b.getCreatedAt() != null)
            .filter(b -> b.getCreatedAt().isBefore(before))
            .toList();
        if (bookings.isEmpty()) {
            return 0;
        }
        return (int) Math.round(bookings.stream()
            .mapToLong(b -> Duration.between(b.getCreatedAt(), b.getUpdatedAt()).toMinutes())
            .average()
            .orElse(0));
    }

    private double computeCompletionRateBefore(UUID mentorId, Instant before) {
        long completed = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> b.getScheduledAt().isBefore(before))
            .count();
        long cancelled = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "cancelled".equals(b.getStatus()))
            .filter(b -> b.getScheduledAt().isBefore(before))
            .count();
        long denominator = completed + cancelled;
        if (denominator == 0) return 0;
        return Math.round((completed * 100.0 / denominator) * 10) / 10.0;
    }

    private int averageDurationMinutesBefore(UUID mentorId, Instant before) {
        return (int) bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 200))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> b.getScheduledAt().isBefore(before))
            .mapToInt(MentorshipBooking::getDurationMinutes)
            .average()
            .orElse(60);
    }

    private double computeRetentionBefore(UUID mentorId, Instant before) {
        Map<UUID, Long> counts = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .filter(b -> b.getScheduledAt().isBefore(before))
            .collect(Collectors.groupingBy(MentorshipBooking::getLearnerId, Collectors.counting()));
        if (counts.isEmpty()) return 0;
        long returning = counts.values().stream().filter(c -> c > 1).count();
        return Math.round((returning * 100.0 / counts.size()) * 10) / 10.0;
    }

    private long countFiveStarSessions(UUID mentorId, double rating, long completed) {
        if (completed == 0) return 0;
        return Math.max(0, Math.round(completed * Math.min(1.0, rating / 5.0)));
    }

    private List<String> buildTeachingTips(
        MentorProfile profile,
        double completionRate,
        double retention,
        int responseTime,
        int avgDuration,
        double rating
    ) {
        List<String> tips = new ArrayList<>();
        if (responseTime > 20) {
            tips.add("Respond to session requests within 15 minutes to improve booking conversion.");
        }
        if (retention < 40) {
            tips.add("Follow up with learners after sessions — retention improves when you assign a small action item.");
        }
        if (completionRate < 85) {
            tips.add("Reduce no-shows by sending a reminder 24 hours before each confirmed session.");
        }
        if (avgDuration < 45) {
            tips.add("Consider extending high-value sessions to 60 minutes for deeper system design or mock interviews.");
        }
        if (rating >= 4.5) {
            tips.add("Your " + String.format(Locale.US, "%.1f", rating) + "★ rating is strong — showcase top reviews on your mentorship plans.");
        } else {
            tips.add("Ask for feedback after sessions and address common themes in your next group webinar.");
        }
        if (tips.isEmpty()) {
            tips.add("Keep a consistent weekly schedule — mentors with regular availability get more repeat bookings.");
        }
        return tips;
    }

    private String generateWithdrawalCode() {
        return "WD" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) return value;
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
