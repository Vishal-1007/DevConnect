package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MentorLeaderboardEntryResponse;
import com.developersconnect.mentor.dto.MentorLeaderboardResponse;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorLeaderboardService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorshipBookingRepository bookingRepository;
    private final MentorProfileService mentorProfileService;

    public MentorLeaderboardService(
        MentorProfileRepository mentorProfileRepository,
        MentorshipBookingRepository bookingRepository,
        MentorProfileService mentorProfileService
    ) {
        this.mentorProfileRepository = mentorProfileRepository;
        this.bookingRepository = bookingRepository;
        this.mentorProfileService = mentorProfileService;
    }

    @Transactional(readOnly = true)
    public MentorLeaderboardResponse getLeaderboard(UUID mentorId, String period, int limit) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }

        String normalizedPeriod = normalize(period, "all");
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        Instant since = periodStart(normalizedPeriod);

        List<ScoredMentor> scored = mentorProfileRepository.findAll().stream()
            .filter(MentorProfile::isVerified)
            .map(profile -> scoreMentor(profile, since))
            .sorted(Comparator.comparingInt(ScoredMentor::points).reversed()
                .thenComparing(Comparator.comparingDouble(ScoredMentor::averageRating).reversed())
                .thenComparingLong(ScoredMentor::sessionsCompleted).reversed())
            .toList();

        List<MentorLeaderboardEntryResponse> ranked = new ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            ranked.add(toEntry(scored.get(i), i + 1, mentorId));
        }

        List<MentorLeaderboardEntryResponse> top = ranked.stream().limit(safeLimit).toList();
        MentorLeaderboardEntryResponse currentUser = ranked.stream()
            .filter(e -> e.mentorId().equals(mentorId))
            .findFirst()
            .orElse(buildDefaultEntry(mentorId, ranked.size() + 1));

        return new MentorLeaderboardResponse(top, currentUser, normalizedPeriod, ranked.size());
    }

    private ScoredMentor scoreMentor(MentorProfile profile, Instant since) {
        UUID mentorId = profile.getUserId();
        long sessions;
        if (Instant.EPOCH.equals(since)) {
            sessions = bookingRepository.countByMentorIdAndStatus(mentorId, "completed");
        } else {
            sessions = bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
                .stream()
                .filter(b -> "completed".equals(b.getStatus()))
                .filter(b -> !b.getScheduledAt().isBefore(since))
                .count();
        }

        double retention = computeRetention(mentorId);
        int streakDays = (int) Math.max(
            ChronoUnit.DAYS.between(profile.getCreatedAt(), Instant.now()),
            profile.getRatingCount() / 2L
        );
        int activityScore = (int) bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 100))
            .stream()
            .filter(b -> b.getScheduledAt().isAfter(since))
            .count();

        int points = (int) (
            profile.getAverageRating() * 40
                + sessions * 25
                + retention * 0.5
                + Math.min(streakDays / 5, 200)
                + activityScore * 5
        );

        return new ScoredMentor(profile, sessions, retention, streakDays, points);
    }

    private double computeRetention(UUID mentorId) {
        Map<UUID, Long> counts = bookingRepository
            .findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .collect(Collectors.groupingBy(MentorshipBooking::getLearnerId, Collectors.counting()));
        if (counts.isEmpty()) {
            return 0;
        }
        long returning = counts.values().stream().filter(c -> c > 1).count();
        return Math.round((returning * 100.0 / counts.size()) * 10) / 10.0;
    }

    private MentorLeaderboardEntryResponse toEntry(ScoredMentor scored, int rank, UUID viewerId) {
        MentorProfile profile = scored.profile();
        String headline = profile.getHeadline() != null ? profile.getHeadline() : "Mentor";
        String displayName = headline.contains(" — ")
            ? headline.substring(0, headline.indexOf(" — "))
            : headline;

        return new MentorLeaderboardEntryResponse(
            rank,
            profile.getUserId(),
            displayName,
            headline,
            profile.getAverageRating(),
            scored.sessionsCompleted(),
            scored.points(),
            scored.streakDays(),
            scored.retentionPct(),
            profile.getUserId().equals(viewerId)
        );
    }

    private MentorLeaderboardEntryResponse buildDefaultEntry(UUID mentorId, int rank) {
        return mentorProfileRepository.findById(mentorId)
            .map(profile -> toEntry(scoreMentor(profile, Instant.EPOCH), rank, mentorId))
            .orElse(new MentorLeaderboardEntryResponse(
                rank, mentorId, "You", "Mentor", 0, 0, 0, 0, 0, true
            ));
    }

    private Instant periodStart(String period) {
        return switch (period) {
            case "weekly" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "monthly" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> Instant.EPOCH;
        };
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private record ScoredMentor(
        MentorProfile profile,
        long sessionsCompleted,
        double retentionPct,
        int streakDays,
        int points
    ) {
        double averageRating() {
            return profile.getAverageRating();
        }
    }
}
