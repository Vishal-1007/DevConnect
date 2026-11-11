package com.developersconnect.mentor.dto;

import java.time.LocalDate;

public record MentorFeedbackTestimonialResponse(
    String studentName,
    int rating,
    String comment,
    LocalDate createdAt
) {}
