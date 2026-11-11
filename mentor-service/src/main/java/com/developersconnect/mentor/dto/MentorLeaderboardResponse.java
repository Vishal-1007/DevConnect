package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorLeaderboardResponse(
    List<MentorLeaderboardEntryResponse> entries,
    MentorLeaderboardEntryResponse currentUser,
    String period,
    int totalMentors
) {}
