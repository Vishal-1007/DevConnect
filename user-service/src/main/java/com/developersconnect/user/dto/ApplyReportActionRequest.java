package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApplyReportActionRequest(
    @NotBlank String action,
    @Size(max = 1000) String note
) {
}
