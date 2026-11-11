package com.developersconnect.user.dto;

public record PlatformHealthItemResponse(
    String name,
    String status,
    String detail,
    boolean healthy
) {}
