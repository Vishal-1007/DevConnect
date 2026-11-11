package com.developersconnect.payment.dto;

public record InterviewCalendarEventResponse(
    String googleCalendarEventId,
    String meetingLink,
    boolean calendarEventCreated,
    boolean candidateInviteSent,
    String message
) {}
