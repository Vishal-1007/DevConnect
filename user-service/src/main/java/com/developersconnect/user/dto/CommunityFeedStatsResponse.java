package com.developersconnect.user.dto;

import java.util.List;

public record CommunityFeedStatsResponse(
    long totalPosts,
    long activeDevelopers,
    long totalDiscussions,
    long trendingTopics,
    List<TrendingTagResponse> trendingTags
) {
}
