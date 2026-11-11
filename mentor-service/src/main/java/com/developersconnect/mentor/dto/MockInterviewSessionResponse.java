package com.developersconnect.mentor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record MockInterviewSessionResponse(
    UUID id,
    UUID requestId,
    String sessionCode,
    UUID roomId,
    @JsonProperty("status") String sessionStatus,
    String startedAt,
    String endedAt,
    MockInterviewRequestResponse request
) {}
