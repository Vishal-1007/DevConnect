package com.developersconnect.mentor.dto;

import java.util.UUID;

public record LessonProgressResponse(
    UUID lessonId,
    UUID courseId,
    int progressSeconds,
    int watchedDurationSeconds,
    boolean completed,
    int courseProgressPercent
) {
}
