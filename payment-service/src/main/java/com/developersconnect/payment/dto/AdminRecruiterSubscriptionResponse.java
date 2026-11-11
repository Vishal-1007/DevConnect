package com.developersconnect.payment.dto;

import com.developersconnect.payment.model.RecruiterPlanType;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record AdminRecruiterSubscriptionResponse(
    UUID id,
    UUID recruiterId,
    RecruiterPlanType planType,
    String status,
    Instant startDate,
    Instant expiryDate,
    int usedJobPosts,
    int activeJobLimit,
    int usedSearches,
    int candidateSearchLimit,
    int usedMessages,
    int messageLimit
) {}
