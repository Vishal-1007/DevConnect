package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MentorProfileSettingsResponse(
    UUID userId,
    String fullName,
    String email,
    String phone,
    String profileImageUrl,
    String professionalTitle,
    String currentCompany,
    String currentRole,
    String totalExperience,
    String bio,
    List<String> skills,
    List<String> technologies,
    List<String> mentorshipCategories,
    Integer sessionDurationMinutes,
    Integer hourlyRateCents,
    Integer mockInterviewPriceCents,
    Integer resumeReviewPriceCents,
    boolean freeSessionAllowed,
    boolean available,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    double averageRating,
    long ratingCount,
    long sessionsCompleted,
    long studentsMentored,
    Instant updatedAt
) {}
