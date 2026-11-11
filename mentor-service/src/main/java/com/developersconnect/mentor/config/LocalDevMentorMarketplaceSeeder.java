package com.developersconnect.mentor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.developersconnect.mentor.model.MentorPricing;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorPricingRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.service.MentorMarketplaceService;

@Component
@Profile("local")
@Order(50)
public class LocalDevMentorMarketplaceSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevMentorMarketplaceSeeder.class);

    private final MentorPricingRepository pricingRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorMarketplaceService marketplaceService;

    public LocalDevMentorMarketplaceSeeder(
        MentorPricingRepository pricingRepository,
        MentorProfileRepository profileRepository,
        MentorMarketplaceService marketplaceService
    ) {
        this.pricingRepository = pricingRepository;
        this.profileRepository = profileRepository;
        this.marketplaceService = marketplaceService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int created = 0;
        for (MentorProfile profile : profileRepository.findByVerifiedTrueAndAvailableTrueOrderByAverageRatingDesc()) {
            if (!pricingRepository.existsById(profile.getUserId())) {
                marketplaceService.ensureDefaultPricing(profile.getUserId(), profile);
                created++;
            }
        }
        enrichDemoPricing();
        log.info("Marketplace pricing ready for verified mentors ({} new pricing rows)", created);
    }

    private void enrichDemoPricing() {
        profileRepository.findAll().forEach(profile -> {
            MentorPricing pricing = pricingRepository.findById(profile.getUserId()).orElse(null);
            if (pricing == null) {
                return;
            }
            if (profile.getFullName() != null && profile.getFullName().contains("Rahul")) {
                applyEnriched(pricing, "Senior Backend Engineer", "Paytm", 8,
                    "Java,Spring Boot,Microservices,System Design", 1500, 2500, 324);
            } else if (profile.getFullName() != null && profile.getFullName().contains("Sarah")) {
                applyEnriched(pricing, "Staff Frontend Engineer", "Swiggy", 7,
                    "React,TypeScript,Performance,UI Architecture", 1200, 2000, 189);
            } else if (profile.getFullName() != null && profile.getFullName().contains("Mike")) {
                applyEnriched(pricing, "Principal Engineer", "Amazon", 10,
                    "DSA,Algorithms,Interview Prep,Java", 1800, 3000, 412);
            }
        });
    }

    private void applyEnriched(
        MentorPricing pricing,
        String designation,
        String companyName,
        int experienceYears,
        String tags,
        long audioCents,
        long videoCents,
        long sessions
    ) {
        pricing.setDesignation(designation);
        pricing.setCompany(companyName);
        pricing.setExperienceYears(experienceYears);
        pricing.setExpertiseTags(tags);
        pricing.setAudioPricePerMinuteCents(audioCents);
        pricing.setVideoPricePerMinuteCents(videoCents);
        pricing.setSessionsCompleted(sessions);
        pricing.setInstantCallEnabled(true);
        pricing.setStatus("ACTIVE");
        pricingRepository.save(pricing);
    }
}
