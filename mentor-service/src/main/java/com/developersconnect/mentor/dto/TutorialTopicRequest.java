package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TutorialTopicRequest(
    @NotBlank @Size(max = 200) String title
) {}
