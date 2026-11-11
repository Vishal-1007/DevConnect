package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MyMentorSummaryResponse(
    UUID mentorId,
    String mentorName,
    String headline,
    String company,
    String experienceRange,
    String profileImageUrl,
    double averageRating,
    long ratingCount,
    boolean available
) {}
