package com.developersconnect.mentor.dto;

public record UpdateMentorshipBookingRequest(
    String status,
    String notes
) {
}
