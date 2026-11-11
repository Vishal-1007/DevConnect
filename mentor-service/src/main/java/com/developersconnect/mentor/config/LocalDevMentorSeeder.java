package com.developersconnect.mentor.config;

import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(5)
public class LocalDevMentorSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevMentorSeeder.class);

    private static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final MentorProfileRepository profileRepository;

    public LocalDevMentorSeeder(MentorProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(RAHUL_ID, "Rahul Sharma", "Senior Backend Developer | Java | Spring Boot",
            "Senior engineer with 150+ mock interviews conducted. Specializes in system design and Java.",
            4500, 4.9, 156, "Paytm", "Senior Backend Engineer", "8 Years");
        seed(SARAH_ID, "Sarah Chen", "Staff Frontend Engineer | React | TypeScript",
            "Frontend lead offering React, performance, and UI architecture mock interviews.",
            5000, 4.8, 89, "Swiggy", "Staff Frontend Engineer", "7 Years");
        seed(MIKE_ID, "Mike Johnson", "Principal Engineer | DSA | Interview Prep",
            "Staff engineer focused on algorithms, data structures, and FAANG-style interviews.",
            4000, 4.7, 203, "Amazon", "Principal Engineer", "10 Years");
        log.info("Seeded {} local demo mentor profiles", 3);
    }

    private void seed(
        UUID userId,
        String fullName,
        String headline,
        String bio,
        int hourlyRateCents,
        double rating,
        int sessionCount,
        String company,
        String designation,
        String experienceRange
    ) {
        if (profileRepository.existsById(userId)) {
            return;
        }
        MentorProfile profile = new MentorProfile();
        profile.setUserId(userId);
        profile.setFullName(fullName);
        profile.setHeadline(headline);
        profile.setBio(bio);
        profile.setCompany(company);
        profile.setDesignation(designation);
        profile.setExperienceRange(experienceRange);
        profile.setHourlyRateCents(hourlyRateCents);
        profile.setVerified(true);
        profile.setAvailable(true);
        profile.setAdminStatus("ACTIVE");
        profile.setAverageRating(rating);
        profile.setRatingCount(sessionCount);
        profile.setSessionsCompleted(sessionCount);
        profileRepository.save(profile);
    }
}
