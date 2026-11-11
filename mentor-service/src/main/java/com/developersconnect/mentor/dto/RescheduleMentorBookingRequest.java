package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record RescheduleMentorBookingRequest(
    @NotNull Instant scheduledAt,
    boolean confirmImmediately
) {}
