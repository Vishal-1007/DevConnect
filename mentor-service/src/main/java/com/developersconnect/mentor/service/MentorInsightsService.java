package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MentorAnalyticsResponse;
import com.developersconnect.mentor.dto.MentorEarningsResponse;
import com.developersconnect.mentor.dto.MentorPerformanceInsightResponse;
import com.developersconnect.mentor.dto.MentorPerformanceInsightsResponse;
import com.developersconnect.mentor.dto.MentorTopicPerformanceResponse;
import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorInsightsService {

    private final MentorWorkspaceService workspaceService;
    private final MentorshipBookingRepository bookingRepository;
    private final MentorAvailabilitySlotRepository availabilityRepository;

    public MentorInsightsService(
        MentorWorkspaceService workspaceService,
        MentorshipBookingRepository bookingRepository,
        MentorAvailabilitySlotRepository availabilityRepository
    ) {
        this.workspaceService = workspaceService;
        this.bookingRepository = bookingRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @Transactional(readOnly = true)
    public MentorPerformanceInsightsResponse getInsights(UUID mentorId) {
        MentorAnalyticsResponse analytics = workspaceService.getAnalytics(mentorId);
        MentorEarningsResponse earnings = workspaceService.getEarnings(mentorId);

        String topTopic = analytics.topicPerformance().stream()
            .max(Comparator.comparingInt(MentorTopicPerformanceResponse::scorePct))
            .map(MentorTopicPerformanceResponse::topic)
            .orElse("System Design");

        String improvementArea = resolveImprovementArea(analytics);
        String bookingTrend = resolveBookingTrend(earnings.revenueGrowthPct(), analytics.sessionsGrowthPct());
        double satisfaction = Math.min(100, analytics.averageRating() * 20);

        List<MentorPerformanceInsightResponse> insights = buildInsights(
            mentorId, analytics, earnings, topTopic, improvementArea
        );

        return new MentorPerformanceInsightsResponse(
            Math.round(satisfaction * 10) / 10.0,
            topTopic,
            improvementArea,
            bookingTrend,
            insights
        );
    }

    private List<MentorPerformanceInsightResponse> buildInsights(
        UUID mentorId,
        MentorAnalyticsResponse analytics,
        MentorEarningsResponse earnings,
        String topTopic,
        String improvementArea
    ) {
        List<MentorPerformanceInsightResponse> insights = new ArrayList<>();

        if (analytics.averageRating() >= 4.0) {
            insights.add(new MentorPerformanceInsightResponse(
                "top-topic",
                "positive",
                "Your " + topTopic + " sessions have highest ratings",
                String.format(
                    Locale.US,
                    "Students rate your %s track %.1f★ on average with a %d%% topic performance score. Package this into a mentorship plan.",
                    topTopic,
                    analytics.averageRating(),
                    analytics.topicPerformance().stream()
                        .filter(t -> t.topic().equals(topTopic))
                        .map(MentorTopicPerformanceResponse::scorePct)
                        .findFirst()
                        .orElse(80)
                ),
                "Create Plan",
                "plans"
            ));
        }

        if (hasEveningAvailability(mentorId)) {
            insights.add(new MentorPerformanceInsightResponse(
                "evening-slots",
                "positive",
                "Evening slots get more bookings",
                "Your availability includes prime evening hours (6 PM – 10 PM). Students book these slots 2× more often than morning slots.",
                "Update Schedule",
                "availability"
            ));
        } else {
            insights.add(new MentorPerformanceInsightResponse(
                "evening-slots",
                "tip",
                "Evening slots get more bookings",
                "Students prefer 6 PM – 10 PM slots. Expanding availability in this window could boost monthly revenue.",
                "Update Schedule",
                "availability"
            ));
        }

        insights.add(new MentorPerformanceInsightResponse(
            "webinar-visibility",
            "tip",
            "Host a webinar to grow visibility",
            "Mentors who host community webinars get more profile views and student discovery.",
            "Host Webinar",
            "host-webinar"
        ));

        if (analytics.responseTimeMinutes() > 15) {
            insights.add(new MentorPerformanceInsightResponse(
                "response-time",
                "warning",
                "Response time above platform average",
                String.format(
                    Locale.US,
                    "Average response time is %d min. Faster responses increase booking conversion.",
                    analytics.responseTimeMinutes()
                ),
                "View Requests",
                "session-requests"
            ));
        }

        if (earnings.revenueGrowthPct() > 0) {
            insights.add(new MentorPerformanceInsightResponse(
                "revenue-trend",
                "positive",
                "Revenue is trending up",
                String.format(
                    Locale.US,
                    "Monthly revenue grew %.1f%%. Your %.1f★ rating supports continued growth.",
                    earnings.revenueGrowthPct(),
                    analytics.averageRating()
                ),
                "View Earnings",
                "earnings"
            ));
        } else {
            insights.add(new MentorPerformanceInsightResponse(
                "revenue-trend",
                "tip",
                "Build your mentorship business",
                String.format(
                    Locale.US,
                    "Your %.1f★ rating and %d completed sessions are the foundation — confirm pending bookings to accelerate earnings.",
                    analytics.averageRating(),
                    analytics.sessionsCompleted()
                ),
                "View Bookings",
                "bookings"
            ));
        }

        if (analytics.studentRetentionPct() < 50) {
            insights.add(new MentorPerformanceInsightResponse(
                "retention",
                "warning",
                "Focus on student retention",
                String.format(
                    Locale.US,
                    "Retention is at %.1f%%. Follow-up notes and structured roadmaps help learners return for repeat sessions.",
                    analytics.studentRetentionPct()
                ),
                "My Students",
                "my-students"
            ));
        }

        if (!improvementArea.isBlank()) {
            insights.add(new MentorPerformanceInsightResponse(
                "improvement",
                "tip",
                "Improvement area: " + improvementArea,
                "AI analysis suggests focusing on " + improvementArea.toLowerCase(Locale.ROOT)
                    + " to strengthen your mentor profile and booking conversion.",
                "Session Analytics",
                "session-analytics"
            ));
        }

        return insights;
    }

    private String resolveImprovementArea(MentorAnalyticsResponse analytics) {
        if (analytics.noShowRatePct() > 10) {
            return "No-show rate";
        }
        if (analytics.responseTimeMinutes() > 20) {
            return "Response time";
        }
        if (analytics.completionRatePct() < 80) {
            return "Session completion";
        }
        if (analytics.studentRetentionPct() < 40) {
            return "Student retention";
        }
        if (analytics.averageDurationMinutes() < 45) {
            return "Session depth";
        }
        return "Booking consistency";
    }

    private String resolveBookingTrend(double revenueGrowth, double sessionsGrowth) {
        if (revenueGrowth > 10 || sessionsGrowth > 10) {
            return "Growing — bookings and revenue are trending up";
        }
        if (revenueGrowth > 0 || sessionsGrowth > 0) {
            return "Stable — steady booking activity this month";
        }
        return "Opportunity — expand availability to increase bookings";
    }

    private boolean hasEveningAvailability(UUID mentorId) {
        List<MentorAvailabilitySlot> slots = availabilityRepository
            .findAllByMentorIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(mentorId);
        return slots.stream().anyMatch(slot -> {
            try {
                LocalTime start = LocalTime.parse(slot.getStartTime());
                LocalTime end = LocalTime.parse(slot.getEndTime());
                return !start.isAfter(LocalTime.of(22, 0)) && !end.isBefore(LocalTime.of(18, 0));
            } catch (Exception ex) {
                return false;
            }
        });
    }
}
