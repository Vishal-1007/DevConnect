package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorStudentResponse(
    UUID learnerId,
    String name,
    String role,
    int sessions,
    int progressPct,
    String weakArea,
    String strongArea,
    String status,
    String lastSessionLabel,
    Instant lastSessionAt,
    String category,
    String categoryLabel,
    int interviewReadinessPct,
    String interviewTarget,
    String notesPreview,
    int assignedTaskCount,
    int pendingTaskCount,
    int improvementPct
) {}
