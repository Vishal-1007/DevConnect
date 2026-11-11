package com.developersconnect.mentor.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record ShareMentorSharedNoteRequest(
    @NotEmpty List<UUID> learnerIds,
    @Size(max = 500) String message
) {}
