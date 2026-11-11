package com.developersconnect.user.config;

import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.UserProfileRepository;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo mentor profiles for local development so Find Match works with a single real account.
 */
@Component
@Profile("local")
@Order(10)
public class LocalDevDemoProfiles implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevDemoProfiles.class);

    public static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    public static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    public static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final UserProfileRepository userProfileRepository;

    public LocalDevDemoProfiles(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed(RAHUL_ID, "rahul.demo", "Rahul Sharma", "Senior Backend Engineer at Paytm",
            "Expert in system design, Java, and Spring Boot.", "mentor", "senior",
            Set.of("java", "spring", "system-design", "backend"), 980);
        seed(SARAH_ID, "sarah.demo", "Sarah Chen", "Frontend Lead at Google",
            "React performance, frontend architecture, and UI best practices.", "mentor", "senior",
            Set.of("react", "frontend", "javascript", "performance"), 1250);
        seed(MIKE_ID, "mike.demo", "Mike Johnson", "Staff Engineer at Amazon",
            "DSA, algorithms, and interview preparation.", "mentor", "senior",
            Set.of("dsa", "algorithms", "java", "interview-prep"), 840);
        log.info("Seeded {} local demo mentor profiles for matching", 3);
    }

    private void seed(
        UUID id,
        String username,
        String displayName,
        String role,
        String bio,
        String profileRole,
        String experienceLevel,
        Set<String> skills,
        int streakCount
    ) {
        if (userProfileRepository.existsById(id)) {
            userProfileRepository.findById(id).ifPresent(existing -> {
                if (existing.getStreakCount() < streakCount) {
                    existing.setStreakCount(streakCount);
                    userProfileRepository.save(existing);
                }
            });
            return;
        }
        UserProfile profile = new UserProfile();
        profile.setId(id);
        profile.setUsername(username);
        profile.setDisplayName(displayName);
        profile.setRole(role);
        profile.setBio(bio);
        profile.setExperienceLevel(experienceLevel);
        profile.setSkills(new LinkedHashSet<>(skills));
        profile.setStreakCount(streakCount);
        userProfileRepository.save(profile);
    }
}
