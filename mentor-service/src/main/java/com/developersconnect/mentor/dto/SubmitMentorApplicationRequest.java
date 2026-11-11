package com.developersconnect.mentor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SubmitMentorApplicationRequest(
    @NotNull @Valid MentorApplicationDataDto data
) {}
