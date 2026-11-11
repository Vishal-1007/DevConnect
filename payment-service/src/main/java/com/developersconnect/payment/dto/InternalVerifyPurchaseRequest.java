package com.developersconnect.payment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InternalVerifyPurchaseRequest(
    UUID userId,
    UUID paymentId,
    BigDecimal amount,
    String currency
) {}
