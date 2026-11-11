package com.developersconnect.user.service;

import com.developersconnect.user.dto.LeaderboardEntryResponse;
import com.developersconnect.user.dto.UserStatsResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserStatsService {

    private final UserStreakService userStreakService;
    private final UserActivityService userActivityService;
    private final LeaderboardService leaderboardService;

    public UserStatsService(
        UserStreakService userStreakService,
        UserActivityService userActivityService,
        LeaderboardService leaderboardService
    ) {
        this.userStreakService = userStreakService;
        this.userActivityService = userActivityService;
        this.leaderboardService = leaderboardService;
    }

    @Transactional
    public UserStatsResponse getStats(UUID userId) {
        LeaderboardEntryResponse currentUser = leaderboardService
            .getLeaderboard(userId, "all", "overall", 50)
            .currentUser();

        int streak = userStreakService.syncStreakFromActivity(userId);

        List<String> activityTimestamps = userActivityService.collectActivityTimestamps(userId).stream()
            .map(Instant::toString)
            .toList();

        return new UserStatsResponse(
            streak > 0 ? streak : currentUser.streak(),
            currentUser.points(),
            currentUser.rank(),
            currentUser.posts(),
            currentUser.replies(),
            currentUser.contributions(),
            (int) userActivityService.countCodingSolved(userId),
            (int) userActivityService.countPairSessionsCompleted(userId),
            (int) userActivityService.countPracticeSessionsCompleted(userId),
            userActivityService.averageSessionMinutes(userId),
            activityTimestamps
        );
    }
}
