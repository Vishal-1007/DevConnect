package com.developersconnect.user.service;

import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserStreakService {

    private final UserProfileRepository userProfileRepository;
    private final UserActivityService userActivityService;

    public UserStreakService(
        UserProfileRepository userProfileRepository,
        UserActivityService userActivityService
    ) {
        this.userProfileRepository = userProfileRepository;
        this.userActivityService = userActivityService;
    }

    @Transactional
    public int recordActivity(UUID userId) {
        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        if (profile == null) {
            return 0;
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate last = profile.getLastActivityDate();

        if (last != null && last.equals(today)) {
            return profile.getStreakCount();
        }

        int newStreak;
        if (last == null) {
            newStreak = 1;
        } else if (last.equals(today.minusDays(1))) {
            newStreak = profile.getStreakCount() + 1;
        } else {
            newStreak = 1;
        }

        profile.setStreakCount(newStreak);
        profile.setLastActivityDate(today);
        userProfileRepository.save(profile);
        return newStreak;
    }

    @Transactional
    public int syncStreakFromActivity(UUID userId) {
        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        if (profile == null) {
            return 0;
        }

        int computed = userActivityService.computeCurrentStreak(userId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        var activeDays = userActivityService.collectActiveDays(userId);

        LocalDate latestActivity = activeDays.stream().max(LocalDate::compareTo).orElse(null);
        if (latestActivity != null) {
            profile.setLastActivityDate(latestActivity);
        } else if (profile.getLastActivityDate() == null) {
            profile.setLastActivityDate(today);
        }

        profile.setStreakCount(computed);
        userProfileRepository.save(profile);
        return computed;
    }

    @Transactional
    public void recordActivityAt(UUID userId, Instant instant) {
        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        if (profile == null) {
            return;
        }

        LocalDate activityDay = LocalDate.ofInstant(instant, ZoneOffset.UTC);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate last = profile.getLastActivityDate();

        if (last != null && last.equals(activityDay) && activityDay.equals(today)) {
            return;
        }

        syncStreakFromActivity(userId);
    }
}
