package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.UUID;

public record CourseProgressResponse(
    UUID courseId,
    int totalLessons,
    int completedLessons,
    int progressPercent,
    UUID lastLessonId,
    String lastLessonTitle,
    int lastProgressSeconds,
    Instant lastWatchedAt
) {
}
