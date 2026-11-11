package com.developersconnect.user.service;

import com.developersconnect.user.dto.LeaderboardEntryResponse;
import com.developersconnect.user.dto.LeaderboardResponse;
import com.developersconnect.user.model.ProblemAttempt;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityPostCommentRepository;
import com.developersconnect.user.repository.CommunityPostLikeRepository;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.repository.DiscussionReplyRepository;
import com.developersconnect.user.repository.DiscussionThreadRepository;
import com.developersconnect.user.repository.PairProgrammingSessionRepository;
import com.developersconnect.user.repository.PracticeAttemptRepository;
import com.developersconnect.user.repository.ProblemAttemptRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.UserRatingRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaderboardService {

    private final UserProfileRepository userProfileRepository;
    private final CommunityPostRepository postRepository;
    private final CommunityPostCommentRepository postCommentRepository;
    private final CommunityPostLikeRepository likeRepository;
    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserRatingRepository ratingRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final PairProgrammingSessionRepository pairSessionRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final UserStreakService userStreakService;

    public LeaderboardService(
            UserProfileRepository userProfileRepository,
            CommunityPostRepository postRepository,
            CommunityPostCommentRepository postCommentRepository,
            CommunityPostLikeRepository likeRepository,
            DiscussionThreadRepository threadRepository,
            DiscussionReplyRepository replyRepository,
            UserRatingRepository ratingRepository,
            ProblemAttemptRepository problemAttemptRepository,
            PairProgrammingSessionRepository pairSessionRepository,
            PracticeAttemptRepository practiceAttemptRepository,
            UserStreakService userStreakService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.likeRepository = likeRepository;
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.ratingRepository = ratingRepository;
        this.problemAttemptRepository = problemAttemptRepository;
        this.pairSessionRepository = pairSessionRepository;
        this.practiceAttemptRepository = practiceAttemptRepository;
        this.userStreakService = userStreakService;
    }

    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboard(
            UUID viewerId,
            String period,
            String category,
            int limit
    ) {

        String normalizedPeriod = normalize(period, "all");
        String normalizedCategory = normalize(category, "overall");

        int safeLimit = Math.min(Math.max(limit, 1), 100);

        userStreakService.syncStreakFromActivity(viewerId);

        Instant since = periodStart(normalizedPeriod);

        List<ScoredProfile> scored = userProfileRepository.findAll().stream()
                .map(profile -> scoreProfile(profile, since, normalizedCategory))
                .filter(scoredProfile ->
                        scoredProfile.points() > 0 || scoredProfile.streak() > 0)
                .sorted(buildComparator(normalizedCategory))
                .toList();

        List<LeaderboardEntryResponse> ranked = new ArrayList<>();

        for (int i = 0; i < scored.size(); i++) {
            ranked.add(toEntry(scored.get(i), i + 1));
        }

        List<LeaderboardEntryResponse> top =
                ranked.stream().limit(safeLimit).toList();

        LeaderboardEntryResponse currentUser = ranked.stream()
                .filter(entry -> entry.userId().equals(viewerId))
                .findFirst()
                .orElseGet(() ->
                        buildViewerEntry(
                                viewerId,
                                since,
                                normalizedCategory,
                                ranked.size() + 1
                        )
                );

        return new LeaderboardResponse(
                top,
                currentUser,
                normalizedPeriod,
                normalizedCategory
        );
    }

    private ScoredProfile scoreProfile(
            UserProfile profile,
            Instant since,
            String category
    ) {

        UUID userId = profile.getId();

        long posts =
                postRepository.countByAuthorIdAndCreatedAtAfter(userId, since);

        long postComments =
                postCommentRepository.countByAuthorIdAndCreatedAtAfter(
                        userId,
                        since
                );

        long threads =
                threadRepository.countByAuthorIdAndCreatedAtAfter(
                        userId,
                        since
                );

        long discussionReplies =
                replyRepository.countByAuthorIdAndCreatedAtAfter(
                        userId,
                        since
                );

        long likesReceived =
                likeRepository.countLikesReceivedSince(userId, since);

        long problemsSolved =
                problemAttemptRepository.countByStudentIdAndStatus(
                        userId,
                        ProblemAttempt.STATUS_PASSED
                );

        long pairSessions =
                pairSessionRepository.countCompletedByParticipant(userId);

        long practiceSessions =
                practiceAttemptRepository.countByStudentIdAndStatusIn(
                        userId,
                        List.of(
                                com.developersconnect.user.model.PracticeAttempt.STATUS_COMPLETED,
                                com.developersconnect.user.model.PracticeAttempt.STATUS_FAILED
                        )
                );

        long solvedThreads =
                threadRepository.countByAuthorIdAndSolvedTrue(userId);

        double averageRating = ratingRepository.averageScore(userId);

        long ratingCount = ratingRepository.countByRatedUserId(userId);

        int contributorPoints = (int) (
                posts * 15
                        + postComments * 5
                        + threads * 20
                        + discussionReplies * 8
                        + likesReceived * 3
                        + problemsSolved * 12
                        + pairSessions * 10
                        + practiceSessions * 8
        );

        int mentorPoints = (int) (
                averageRating * 40
                        + ratingCount * 25
                        + solvedThreads * 35
        );

        int streak = profile.getStreakCount();

        int overallPoints =
                contributorPoints + mentorPoints + streak / 5;

        int points = switch (category) {
            case "contributors" -> contributorPoints;
            case "mentors" -> mentorPoints;
            case "streak" -> streak;
            default -> overallPoints;
        };

        int contributions = (int) (
                posts + threads + postComments + discussionReplies
        );

        return new ScoredProfile(
                profile,
                points,
                streak,
                (int) posts,
                (int) discussionReplies,
                contributions,
                averageRating
        );
    }

    private LeaderboardEntryResponse buildViewerEntry(
            UUID viewerId,
            Instant since,
            String category,
            int defaultRank
    ) {

        UserProfile profile =
                userProfileRepository.findById(viewerId).orElse(null);

        if (profile == null) {
            return new LeaderboardEntryResponse(
                    defaultRank,
                    viewerId,
                    "You",
                    "Learner",
                    0,
                    0,
                    0,
                    0,
                    0,
                    0.0
            );
        }

        return toEntry(
                scoreProfile(profile, since, category),
                defaultRank
        );
    }

    private LeaderboardEntryResponse toEntry(
            ScoredProfile scored,
            int rank
    ) {

        UserProfile profile = scored.profile();

        String displayName =
                profile.getDisplayName() != null
                        ? profile.getDisplayName()
                        : profile.getUsername();

        return new LeaderboardEntryResponse(
                rank,
                profile.getId(),
                displayName,
                profile.getRole(),
                scored.points(),
                scored.streak(),
                scored.posts(),
                scored.replies(),
                scored.contributions(),
                scored.averageRating()
        );
    }

    private Comparator<ScoredProfile> buildComparator(String category) {

        if ("streak".equals(category)) {
            return Comparator.comparingInt(
                    ScoredProfile::streak
            ).reversed()
                    .thenComparingInt(
                            ScoredProfile::points
                    ).reversed();
        }

        return Comparator.comparingInt(
                ScoredProfile::points
        ).reversed()
                .thenComparingInt(
                        ScoredProfile::streak
                ).reversed();
    }

    private Instant periodStart(String period) {

        return switch (period) {
            case "weekly" ->
                    Instant.now().minus(7, ChronoUnit.DAYS);

            case "monthly" ->
                    Instant.now().minus(30, ChronoUnit.DAYS);

            default ->
                    Instant.EPOCH;
        };
    }

    private String normalize(String value, String fallback) {

        if (value == null || value.isBlank()) {
            return fallback;
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }

    private record ScoredProfile(
            UserProfile profile,
            int points,
            int streak,
            int posts,
            int replies,
            int contributions,
            double averageRating
    ) {
    }
}