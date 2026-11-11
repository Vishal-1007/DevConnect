package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MarketplaceMentorCardResponse(
    UUID mentorId,
    String displayName,
    String profileImageUrl,
    String designation,
    String company,
    Integer experienceYears,
    List<String> expertiseTags,
    List<String> categories,
    double averageRating,
    long ratingCount,
    long sessionsCompleted,
    int responseMinutes,
    long audioPricePerMinuteCents,
    long videoPricePerMinuteCents,
    String currency,
    String availabilityStatus,
    boolean instantCallEnabled,
    boolean verified,
    String bio,
    String linkedinUrl,
    String location
) {}
