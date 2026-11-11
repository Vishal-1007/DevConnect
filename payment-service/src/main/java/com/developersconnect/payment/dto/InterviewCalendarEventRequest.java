package com.developersconnect.payment.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record InterviewCalendarEventRequest(
    @NotBlank String interviewId,
    @NotBlank String candidateName,
    @Email String candidateEmail,
    @Email String recruiterEmail,
    @NotBlank String jobTitle,
    String interviewType,
    String company,
    String notes,
    String meetingLink,
    @NotNull Instant scheduledAt,
    @Positive int durationMinutes
) {}
