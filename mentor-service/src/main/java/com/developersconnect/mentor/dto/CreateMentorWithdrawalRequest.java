package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record CreateMentorWithdrawalRequest(
    @Min(100) long amountCents,
    @Size(max = 500) String note
) {}
