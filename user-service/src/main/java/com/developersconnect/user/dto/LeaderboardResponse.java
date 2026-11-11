package com.developersconnect.user.dto;

import java.util.List;

public record LeaderboardResponse(
    List<LeaderboardEntryResponse> entries,
    LeaderboardEntryResponse currentUser,
    String period,
    String category
) {
}
