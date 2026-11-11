package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateMentorStudentTaskRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 1000) String description,
    LocalDate dueDate
) {}
