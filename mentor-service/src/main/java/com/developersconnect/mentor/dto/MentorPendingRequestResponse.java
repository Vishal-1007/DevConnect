package com.developersconnect.mentor.dto;



import java.time.Instant;

import java.util.UUID;



public record MentorPendingRequestResponse(

    UUID bookingId,

    String bookingCode,

    UUID learnerId,

    String learnerName,

    String requestType,

    String requestTypeLabel,

    String topic,

    String message,

    boolean premiumLearner,

    int priorityScore,

    String requestedAtLabel,

    Instant requestedAt,

    String scheduledAtLabel,

    Instant scheduledAt,

    int durationMinutes,

    String amountLabel

) {}

