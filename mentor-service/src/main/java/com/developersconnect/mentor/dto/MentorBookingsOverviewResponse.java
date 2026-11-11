package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorBookingsOverviewResponse(
    int confirmedCount,
    int pendingCount,
    int completedCount,
    int cancelledCount,
    int upcomingCount,
    String timezone,
    List<MentorBookingReminderResponse> reminders,
    List<MentorRecurringPlanResponse> recurringPlans
) {}
