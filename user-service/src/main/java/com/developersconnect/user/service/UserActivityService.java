package com.developersconnect.user.service;

import com.developersconnect.user.model.ProblemAttempt;
import com.developersconnect.user.model.PracticeAttempt;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityPostCommentRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.repository.DiscussionReplyRepository;
import com.developersconnect.user.repository.DiscussionThreadRepository;
import com.developersconnect.user.repository.PairProgrammingSessionRepository;
import com.developersconnect.user.repository.PracticeAttemptRepository;
import com.developersconnect.user.repository.ProblemAttemptRepository;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserActivityService {

    private static final int HEATMAP_WEEKS = 28;

    private final CommunityPostRepository postRepository;
    private final CommunityPostCommentRepository commentRepository;
    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final PairProgrammingSessionRepository pairSessionRepository;
    private final VideoRoomParticipantRepository videoRoomParticipantRepository;
    private final UserProfileRepository userProfileRepository;

    public UserActivityService(
        CommunityPostRepository postRepository,
        CommunityPostCommentRepository commentRepository,
        DiscussionThreadRepository threadRepository,
        DiscussionReplyRepository replyRepository,
        ProblemAttemptRepository problemAttemptRepository,
        PracticeAttemptRepository practiceAttemptRepository,
        PairProgrammingSessionRepository pairSessionRepository,
        VideoRoomParticipantRepository videoRoomParticipantRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.problemAttemptRepository = problemAttemptRepository;
        this.practiceAttemptRepository = practiceAttemptRepository;
        this.pairSessionRepository = pairSessionRepository;
        this.videoRoomParticipantRepository = videoRoomParticipantRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<Instant> collectActivityTimestamps(UUID userId) {
        Instant since = Instant.now().minus(HEATMAP_WEEKS * 7L, ChronoUnit.DAYS);
        List<Instant> timestamps = new ArrayList<>();
        timestamps.addAll(postRepository.findActivityTimestampsByAuthorSince(userId, since));
        timestamps.addAll(commentRepository.findActivityTimestampsByAuthorSince(userId, since));
        timestamps.addAll(threadRepository.findActivityTimestampsByAuthorSince(userId, since));
        timestamps.addAll(replyRepository.findActivityTimestampsByAuthorSince(userId, since));
        timestamps.addAll(problemAttemptRepository.findActivityTimestampsByStudentSince(userId, since));
        timestamps.addAll(practiceAttemptRepository.findActivityTimestampsByStudentSince(userId, since));
        timestamps.addAll(pairSessionRepository.findActivityTimestampsByParticipantSince(userId, since));
        timestamps.addAll(videoRoomParticipantRepository.findActivityTimestampsByUserSince(userId, since));
        userProfileRepository.findById(userId)
            .map(UserProfile::getLastActivityDate)
            .ifPresent(day -> timestamps.add(day.atStartOfDay(ZoneOffset.UTC).toInstant()));
        return timestamps;
    }

    @Transactional(readOnly = true)
    public Set<LocalDate> collectActiveDays(UUID userId) {
        Set<LocalDate> days = new HashSet<>();
        for (Instant instant : collectActivityTimestamps(userId)) {
            days.add(LocalDate.ofInstant(instant, ZoneOffset.UTC));
        }
        return days;
    }

    @Transactional(readOnly = true)
    public int computeCurrentStreak(UUID userId) {
        return computeStreakFromDays(collectActiveDays(userId), LocalDate.now(ZoneOffset.UTC));
    }

    static int computeStreakFromDays(Set<LocalDate> activeDays, LocalDate today) {
        if (activeDays.isEmpty()) {
            return 0;
        }
        LocalDate cursor = activeDays.contains(today)
            ? today
            : activeDays.contains(today.minusDays(1)) ? today.minusDays(1) : null;
        if (cursor == null) {
            return 0;
        }
        int streak = 0;
        while (activeDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    @Transactional(readOnly = true)
    public int averageSessionMinutes(UUID userId) {
        List<Long> durations = new ArrayList<>();
        for (var session : pairSessionRepository.findCompletedByParticipant(userId)) {
            Instant start = session.getStartedAt() != null ? session.getStartedAt() : session.getCreatedAt();
            Instant end = session.getEndedAt() != null ? session.getEndedAt() : session.getUpdatedAt();
            if (start != null && end != null && end.isAfter(start)) {
                durations.add(ChronoUnit.MINUTES.between(start, end));
            }
        }
        for (var attempt : practiceAttemptRepository.findByStudentIdAndStatusIn(
            userId,
            List.of(PracticeAttempt.STATUS_COMPLETED, PracticeAttempt.STATUS_FAILED)
        )) {
            Instant start = attempt.getStartedAt();
            Instant end = attempt.getCompletedAt() != null ? attempt.getCompletedAt() : attempt.getUpdatedAt();
            if (start != null && end != null && end.isAfter(start)) {
                durations.add(ChronoUnit.MINUTES.between(start, end));
            }
        }
        if (durations.isEmpty()) {
            return 0;
        }
        long total = durations.stream().mapToLong(Long::longValue).sum();
        return (int) Math.round((double) total / durations.size());
    }

    @Transactional(readOnly = true)
    public long countCodingSolved(UUID userId) {
        return problemAttemptRepository.countByStudentIdAndStatus(userId, ProblemAttempt.STATUS_PASSED);
    }

    @Transactional(readOnly = true)
    public long countPairSessionsCompleted(UUID userId) {
        return pairSessionRepository.countCompletedByParticipant(userId);
    }

    @Transactional(readOnly = true)
    public long countPracticeSessionsCompleted(UUID userId) {
        return practiceAttemptRepository.countByStudentIdAndStatusIn(
            userId,
            List.of(PracticeAttempt.STATUS_COMPLETED, PracticeAttempt.STATUS_FAILED)
        );
    }
}
