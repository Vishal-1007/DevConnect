package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MentorSharedNoteResponse(
    UUID id,
    String title,
    String content,
    String materialType,
    String materialTypeLabel,
    List<String> tags,
    String fileName,
    String fileMimeType,
    Long fileSizeBytes,
    boolean hasFile,
    List<UUID> sharedWithLearnerIds,
    int sharedCount,
    UUID linkedBookingId,
    boolean published,
    String createdAtLabel,
    String updatedAtLabel
) {}
