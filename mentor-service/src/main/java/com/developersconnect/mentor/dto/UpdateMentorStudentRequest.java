package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateMentorStudentRequest(
    @Size(max = 32) String category,
    @Size(max = 64) String weakArea,
    @Size(max = 64) String strongArea,
    @Size(max = 5000) String notes,
    @Min(0) @Max(100) Integer interviewReadinessPct,
    @Size(max = 128) String interviewTarget
) {}
