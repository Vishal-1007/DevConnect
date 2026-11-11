package com.developersconnect.auth.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken
) {
}
