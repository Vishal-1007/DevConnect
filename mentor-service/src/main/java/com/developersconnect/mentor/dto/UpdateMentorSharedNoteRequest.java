package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record UpdateMentorSharedNoteRequest(
    @Size(max = 200) String title,
    @Size(max = 50000) String content,
    @Size(max = 32) String materialType,
    List<@Size(max = 64) String> tags,
    @Size(max = 255) String fileName,
    @Size(max = 128) String fileMimeType,
    String fileDataBase64,
    Boolean clearFile,
    List<UUID> sharedWithLearnerIds,
    UUID linkedBookingId,
    Boolean published
) {}
