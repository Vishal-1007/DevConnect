package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateMentorSharedNoteRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 50000) String content,
    @NotBlank @Size(max = 32) String materialType,
    List<@NotBlank @Size(max = 64) String> tags,
    @Size(max = 255) String fileName,
    @Size(max = 128) String fileMimeType,
    String fileDataBase64,
    List<UUID> sharedWithLearnerIds,
    UUID linkedBookingId,
    boolean published
) {}
