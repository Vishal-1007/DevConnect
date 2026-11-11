package com.developersconnect.payment.dto;

import java.math.BigDecimal;

public record RazorpayOrderResponse(
    String orderId,
    BigDecimal amount,
    String currency,
    String keyId,
    String description
) {}
