package com.developersconnect.mentor.dto;

public record SaveLessonProgressRequest(
    int progressSeconds,
    boolean completed,
    Integer watchedDurationSeconds
) {
    public SaveLessonProgressRequest(int progressSeconds, boolean completed) {
        this(progressSeconds, completed, null);
    }
}
