package com.developersconnect.mentor.dto;

public record MentorAccessResponse(
    boolean canAccess,
    String status,
    boolean blocked,
    String message
) {}
