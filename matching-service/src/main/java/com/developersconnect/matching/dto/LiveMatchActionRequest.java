package com.developersconnect.matching.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record LiveMatchActionRequest(
    @NotBlank @Size(max = 512) String criteria,
    @Size(max = 32) String experienceLevel,
    Set<@Size(max = 64) String> skills
) {
}
