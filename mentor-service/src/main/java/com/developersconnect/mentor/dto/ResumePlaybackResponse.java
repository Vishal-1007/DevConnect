package com.developersconnect.mentor.dto;

import java.util.UUID;

public record ResumePlaybackResponse(
    UUID courseId,
    UUID lessonId,
    String lessonTitle,
    int progressSeconds,
    boolean completed,
    boolean hasProgress
) {
}
