package com.developersconnect.mentor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record UpcomingInterviewResponse(
    UUID requestId,
    UUID sessionId,
    String sessionCode,
    UUID interviewerId,
    String interviewerName,
    String interviewerPicture,
    String interviewType,
    String scheduledAt,
    @JsonProperty("status") String bookingStatus,
    boolean canJoin,
    String joinMessage
) {}
