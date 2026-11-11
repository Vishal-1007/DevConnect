package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MentorStudentTaskResponse(
    UUID id,
    String title,
    String description,
    String status,
    LocalDate dueDate,
    String dueDateLabel,
    Instant createdAt
) {}
