package com.developersconnect.mentor.dto;

public record MentorPerformanceInsightResponse(
    String id,
    String type,
    String title,
    String body,
    String actionLabel,
    String actionTarget
) {}
