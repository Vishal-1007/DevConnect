package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MentorStudentSummaryResponse(
    UUID learnerId,
    String name,
    int sessions,
    double rating,
    int progressPct
) {}
