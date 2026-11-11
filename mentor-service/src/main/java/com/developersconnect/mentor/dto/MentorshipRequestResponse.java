package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorshipRequestResponse(
    UUID id,
    UUID mentorId,
    UUID studentId,
    String studentName,
    String studentProfileImageUrl,
    String mentorName,
    String mentorProfileImageUrl,
    String goal,
    String message,
    String status,
    Instant createdAt,
    Instant updatedAt
) {}
