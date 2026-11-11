package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MentorReviewResponse(
    UUID id,
    UUID learnerId,
    String learnerName,
    int rating,
    String reviewText,
    String topic,
    String improvementSuggestion,
    String mentorReply,
    boolean showcased,
    String createdAtLabel,
    Instant createdAt,
    String repliedAtLabel
) {}
