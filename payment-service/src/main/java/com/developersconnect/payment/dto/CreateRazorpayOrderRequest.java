package com.developersconnect.payment.dto;

import java.math.BigDecimal;

public record CreateRazorpayOrderRequest(
    BigDecimal amount,
    String currency,
    String description,
    String idempotencyKey
) {}
