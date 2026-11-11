package com.developersconnect.user.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ConfirmVideoRoomPaymentRequest(@NotNull UUID paymentId) {
}
