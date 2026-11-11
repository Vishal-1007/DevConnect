package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStreamLessonRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 512) String videoUrl,
    @Min(0) int durationSeconds,
    @Min(0) int sortOrder,
    boolean previewFree
) {}
