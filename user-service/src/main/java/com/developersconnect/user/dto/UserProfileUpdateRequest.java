package com.developersconnect.user.dto;

import jakarta.validation.constraints.Size;
import java.util.Set;

public record UserProfileUpdateRequest(
    @Size(max = 128) String displayName,
    @Size(max = 512) String bio,
    @Size(max = 512) String avatarUrl,
    @Size(max = 128) String location,
    @Size(max = 64) String role,
    @Size(max = 32) String experienceLevel,
    @Size(max = 512) String learningGoals,
    @Size(max = 512) String githubUrl,
    @Size(max = 512) String linkedinUrl,
    @Size(max = 512) String portfolioUrl,
    Set<@Size(max = 64) String> skills
) {
}
