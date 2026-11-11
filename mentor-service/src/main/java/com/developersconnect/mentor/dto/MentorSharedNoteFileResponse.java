package com.developersconnect.mentor.dto;

import java.util.UUID;

public record MentorSharedNoteFileResponse(
    UUID id,
    String fileName,
    String fileMimeType,
    Long fileSizeBytes,
    String fileDataBase64
) {}
