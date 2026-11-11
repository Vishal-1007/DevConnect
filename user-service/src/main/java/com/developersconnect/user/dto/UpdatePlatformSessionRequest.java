package com.developersconnect.user.dto;

public record UpdatePlatformSessionRequest(
    Integer qualityScore,
    Boolean recordingAvailable,
    String recordingUrl,
    Boolean aiModerationEnabled,
    String moderationStatus
) {
}
