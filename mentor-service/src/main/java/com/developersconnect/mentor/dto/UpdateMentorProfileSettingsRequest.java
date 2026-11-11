package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateMentorProfileSettingsRequest(
    @Size(max = 128) String fullName,
    @Email @Size(max = 256) String email,
    @Size(max = 32) String phone,
    @Size(max = 512) String profileImageUrl,
    @Size(max = 128) String professionalTitle,
    @Size(max = 128) String currentCompany,
    @Size(max = 128) String currentRole,
    @Size(max = 64) String totalExperience,
    @Size(max = 1024) String bio,
    List<@Size(max = 64) String> skills,
    List<@Size(max = 64) String> technologies,
    List<@Size(max = 64) String> mentorshipCategories,
    @Min(15) Integer sessionDurationMinutes,
    @Min(0) Integer hourlyRateCents,
    @Min(0) Integer mockInterviewPriceCents,
    @Min(0) Integer resumeReviewPriceCents,
    Boolean freeSessionAllowed,
    Boolean available,
    @Size(max = 256) String linkedinUrl,
    @Size(max = 256) String githubUrl,
    @Size(max = 256) String portfolioUrl
) {}
