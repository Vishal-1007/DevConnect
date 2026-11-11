package com.developersconnect.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlatformSessionResponse(
    UUID id,
    String sessionType,
    String title,
    String description,
    UUID hostId,
    String hostDisplayName,
    String status,
    int participantCount,
    int maxParticipants,
    int qualityScore,
    long durationSeconds,
    String durationLabel,
    String recordingUrl,
    boolean recordingAvailable,
    boolean aiModerationEnabled,
    String moderationStatus,
    int reportCount,
    UUID linkedRoomId,
    UUID linkedMatchRequestId,
    Instant startedAt,
    Instant endedAt,
    List<SessionReportResponse> reports
) {
}
