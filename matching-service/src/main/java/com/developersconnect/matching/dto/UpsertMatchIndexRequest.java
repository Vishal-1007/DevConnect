package com.developersconnect.matching.dto;

import jakarta.validation.constraints.Size;
import java.util.Set;

public record UpsertMatchIndexRequest(
    @Size(max = 32) String experienceLevel,
    Set<@Size(max = 64) String> skills
) {
}
