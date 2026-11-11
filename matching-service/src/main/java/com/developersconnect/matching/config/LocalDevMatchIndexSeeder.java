package com.developersconnect.matching.config;

import com.developersconnect.matching.model.UserMatchIndex;
import com.developersconnect.matching.repository.UserMatchIndexRepository;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds demo users in the match index for local development (must match user-service demo UUIDs).
 */
@Component
@Profile("local")
public class LocalDevMatchIndexSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevMatchIndexSeeder.class);

    private static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final UserMatchIndexRepository userMatchIndexRepository;

    public LocalDevMatchIndexSeeder(UserMatchIndexRepository userMatchIndexRepository) {
        this.userMatchIndexRepository = userMatchIndexRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(RAHUL_ID, "senior", Set.of("java", "spring", "system-design", "backend"));
        seed(SARAH_ID, "senior", Set.of("react", "frontend", "javascript", "performance"));
        seed(MIKE_ID, "senior", Set.of("dsa", "algorithms", "java", "interview-prep"));
        log.info("Seeded {} local demo users in match index", 3);
    }

    private void seed(UUID userId, String experienceLevel, Set<String> skills) {
        if (userMatchIndexRepository.existsById(userId)) {
            return;
        }
        UserMatchIndex index = new UserMatchIndex();
        index.setUserId(userId);
        index.setExperienceLevel(experienceLevel);
        index.setSkills(new LinkedHashSet<>(skills));
        userMatchIndexRepository.save(index);
    }
}
