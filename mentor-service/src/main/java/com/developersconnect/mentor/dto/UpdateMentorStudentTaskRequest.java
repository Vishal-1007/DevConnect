package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateMentorStudentTaskRequest(
    @Size(max = 200) String title,
    @Size(max = 1000) String description,
    @Size(max = 32) String status,
    LocalDate dueDate
) {}
