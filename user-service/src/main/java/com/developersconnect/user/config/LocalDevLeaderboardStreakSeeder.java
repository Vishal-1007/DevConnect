package com.developersconnect.user.config;

import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(40)
public class LocalDevLeaderboardStreakSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevLeaderboardStreakSeeder.class);

    private final UserProfileRepository userProfileRepository;

    public LocalDevLeaderboardStreakSeeder(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        updateStreak(LocalDevDemoProfiles.RAHUL_ID, 980);
        updateStreak(LocalDevDemoProfiles.SARAH_ID, 1250);
        updateStreak(LocalDevDemoProfiles.MIKE_ID, 840);
        log.info("Updated demo profile streak counts for leaderboard");
    }

    private void updateStreak(java.util.UUID id, int streak) {
        userProfileRepository.findById(id).ifPresent(profile -> {
            if (profile.getStreakCount() < streak) {
                profile.setStreakCount(streak);
                userProfileRepository.save(profile);
            }
        });
    }
}
