package com.developersconnect.payment.dto;

public record PaymentConfigResponse(
    String gatewayProvider,
    String stripePublishableKey,
    String razorpayKeyId,
    boolean razorpayEnabled
) {
}
