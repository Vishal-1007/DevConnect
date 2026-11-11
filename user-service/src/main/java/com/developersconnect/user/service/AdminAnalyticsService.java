package com.developersconnect.user.service;

import com.developersconnect.user.dto.AnalyticsTrendPoint;
import com.developersconnect.user.dto.BusinessAnalyticsResponse;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.repository.PlatformSessionRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAnalyticsService {

    private final UserProfileRepository userProfileRepository;
    private final CommunityPostRepository postRepository;
    private final PlatformSessionRepository sessionRepository;
    private final CommunityEventRegistrationRepository registrationRepository;

    public AdminAnalyticsService(
        UserProfileRepository userProfileRepository,
        CommunityPostRepository postRepository,
        PlatformSessionRepository sessionRepository,
        CommunityEventRegistrationRepository registrationRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.postRepository = postRepository;
        this.sessionRepository = sessionRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public BusinessAnalyticsResponse getBusinessAnalytics() {
        Instant now = Instant.now();
        Instant dayAgo = now.minus(1, ChronoUnit.DAYS);
        Instant monthAgo = now.minus(30, ChronoUnit.DAYS);
        Instant prevMonthStart = now.minus(60, ChronoUnit.DAYS);

        long totalUsers = userProfileRepository.count();
        long activeUsers = userProfileRepository.countByUpdatedAtAfter(monthAgo);
        long dau = estimateActiveUsers(dayAgo, now);
        long mau = estimateActiveUsers(monthAgo, now);
        double dauMauRatio = mau > 0 ? round1((dau * 100.0) / mau) : 0;

        long cohortBase = userProfileRepository.countByCreatedAtBefore(monthAgo);
        double retentionRate = cohortBase > 0 ? round1((activeUsers * 100.0) / Math.max(cohortBase, 1)) : 100.0;
        long prevActive = userProfileRepository.countByUpdatedAtAfter(prevMonthStart);
        double retentionDelta = prevActive > 0 ? round1(retentionRate - ((prevActive * 100.0) / Math.max(cohortBase, 1))) : 0;

        long mentorProfiles = userProfileRepository.countByRoleIgnoreCaseContaining("mentor");
        long mentorSessions = sessionRepository.countBySessionType("mentorship");
        long completedSessions = sessionRepository.countByStatus("ended");
        long liveSessions = sessionRepository.countByStatus("live");
        long totalSessions = completedSessions + liveSessions;
        double sessionCompletionRate = totalSessions > 0
            ? round1((completedSessions * 100.0) / totalSessions)
            : 0;

        double mentorEngagement = Math.min(100, round1(
            (mentorSessions * 15.0) + (mentorProfiles * 8.0) + (completedSessions * 2.0)
        ));

        long usersThisMonth = userProfileRepository.findAll().stream()
            .filter(u -> u.getCreatedAt().isAfter(monthAgo))
            .count();
        long usersPrevMonth = userProfileRepository.findAll().stream()
            .filter(u -> u.getCreatedAt().isAfter(prevMonthStart) && u.getCreatedAt().isBefore(monthAgo))
            .count();
        double userGrowthMoM = usersPrevMonth > 0
            ? round1(((usersThisMonth - usersPrevMonth) * 100.0) / usersPrevMonth)
            : usersThisMonth > 0 ? 100.0 : 0;

        long totalPosts = postRepository.count();
        double engagementScore = Math.min(100, round1(
            (dauMauRatio * 0.35) + (retentionRate * 0.25) + (sessionCompletionRate * 0.2) + (mentorEngagement * 0.2)
        ));

        return new BusinessAnalyticsResponse(
            totalUsers,
            activeUsers,
            dau,
            mau,
            dauMauRatio,
            retentionRate,
            retentionDelta,
            mentorEngagement,
            mentorProfiles,
            mentorSessions,
            sessionCompletionRate,
            userGrowthMoM,
            engagementScore,
            mentorProfiles,
            totalPosts,
            totalSessions,
            completedSessions,
            liveSessions,
            buildMonthlyTrend(userProfileRepository.findAll(), UserProfile::getCreatedAt),
            buildMonthlyTrend(postRepository.findAll(), p -> p.getCreatedAt()),
            buildMonthlyTrend(sessionRepository.findAll(), s -> s.getStartedAt()),
            List.of(
                new AnalyticsTrendPoint("Active Users", activeUsers),
                new AnalyticsTrendPoint("Mentors", mentorProfiles),
                new AnalyticsTrendPoint("Learners", Math.max(0, totalUsers - mentorProfiles)),
                new AnalyticsTrendPoint("Inactive", Math.max(0, totalUsers - activeUsers))
            )
        );
    }

    private long estimateActiveUsers(Instant since, Instant until) {
        Set<UUID> active = new HashSet<>();
        postRepository.findAll().stream()
            .filter(p -> isBetween(p.getCreatedAt(), since, until))
            .forEach(p -> active.add(p.getAuthorId()));
        sessionRepository.findAll().stream()
            .filter(s -> isBetween(s.getStartedAt(), since, until))
            .forEach(s -> active.add(s.getHostId()));
        registrationRepository.findAll().stream()
            .filter(r -> isBetween(r.getRegisteredAt(), since, until))
            .forEach(r -> active.add(r.getUserId()));
        userProfileRepository.findAll().stream()
            .filter(u -> isBetween(u.getUpdatedAt(), since, until))
            .forEach(u -> active.add(u.getId()));
        return active.size();
    }

    private <T> List<AnalyticsTrendPoint> buildMonthlyTrend(List<T> items, java.util.function.Function<T, Instant> timeFn) {
        Map<YearMonth, Long> buckets = new LinkedHashMap<>();
        YearMonth current = YearMonth.now(ZoneId.systemDefault());
        for (int i = 11; i >= 0; i--) {
            buckets.put(current.minusMonths(i), 0L);
        }
        for (T item : items) {
            Instant ts = timeFn.apply(item);
            if (ts == null) {
                continue;
            }
            YearMonth ym = YearMonth.from(ts.atZone(ZoneId.systemDefault()));
            if (buckets.containsKey(ym)) {
                buckets.put(ym, buckets.get(ym) + 1);
            }
        }
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM", Locale.US);
        return buckets.entrySet().stream()
            .map(e -> new AnalyticsTrendPoint(e.getKey().format(fmt), e.getValue()))
            .toList();
    }

    private boolean isBetween(Instant value, Instant start, Instant end) {
        return value != null && !value.isBefore(start) && !value.isAfter(end);
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
