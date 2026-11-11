package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MarketplaceMentorCardResponse;
import com.developersconnect.mentor.dto.MarketplaceStatsResponse;
import com.developersconnect.mentor.dto.MentorPricingResponse;
import com.developersconnect.mentor.dto.UpsertMentorPricingRequest;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorPricing;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorPricingRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorMarketplaceService {

    private final MentorPricingRepository pricingRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorApplicationRepository applicationRepository;
    private final MentorProfileService mentorProfileService;

    public MentorMarketplaceService(
        MentorPricingRepository pricingRepository,
        MentorProfileRepository profileRepository,
        MentorApplicationRepository applicationRepository,
        MentorProfileService mentorProfileService
    ) {
        this.pricingRepository = pricingRepository;
        this.profileRepository = profileRepository;
        this.applicationRepository = applicationRepository;
        this.mentorProfileService = mentorProfileService;
    }

    @Transactional
    public List<MarketplaceMentorCardResponse> listAvailableMentors() {
        return profileRepository.findByVerifiedTrueAndAvailableTrueOrderByAverageRatingDesc().stream()
            .map(profile -> {
                MentorPricing pricing = ensureDefaultPricing(profile.getUserId(), profile);
                if (!pricing.isInstantCallEnabled() || !"ACTIVE".equals(pricing.getStatus())) {
                    return null;
                }
                return toCard(pricing);
            })
            .filter(java.util.Objects::nonNull)
            .toList();
    }

    @Transactional(readOnly = true)
    public MarketplaceStatsResponse getMarketplaceStats() {
        List<MarketplaceMentorCardResponse> mentors = listAvailableMentors();
        long online = mentors.stream().filter(m -> "AVAILABLE".equals(m.availabilityStatus())).count();
        long avgPrice = mentors.isEmpty() ? 0
            : mentors.stream().mapToLong(MarketplaceMentorCardResponse::videoPricePerMinuteCents).sum() / mentors.size();
        long sessions = mentors.stream().mapToLong(MarketplaceMentorCardResponse::sessionsCompleted).sum();
        return new MarketplaceStatsResponse(mentors.size(), online, avgPrice, Math.max(sessions / 10, 0));
    }

    @Transactional(readOnly = true)
    public MarketplaceMentorCardResponse getMentor(UUID mentorId) {
        MentorPricing pricing = pricingRepository.findById(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor marketplace profile not found"));
        return toCard(pricing);
    }

    @Transactional
    public MentorPricingResponse getMyPricing(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        MentorPricing pricing = pricingRepository.findById(mentorId).orElseGet(() -> {
            MentorProfile profile = profileRepository.findById(mentorId).orElse(null);
            return ensureDefaultPricing(mentorId, profile);
        });
        return toPricingResponse(pricing);
    }

    @Transactional
    public MentorPricingResponse upsertPricing(UUID mentorId, UpsertMentorPricingRequest request) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }

        MentorPricing pricing = pricingRepository.findById(mentorId).orElseGet(() -> {
            MentorPricing created = new MentorPricing();
            created.setMentorId(mentorId);
            created.setAudioPricePerMinuteCents(1500);
            created.setVideoPricePerMinuteCents(2500);
            return created;
        });

        pricing.setAudioPricePerMinuteCents(request.audioPricePerMinuteCents());
        pricing.setVideoPricePerMinuteCents(request.videoPricePerMinuteCents());
        if (request.instantCallEnabled() != null) {
            pricing.setInstantCallEnabled(request.instantCallEnabled());
        }
        if (request.designation() != null) {
            pricing.setDesignation(request.designation().trim());
        }
        if (request.company() != null) {
            pricing.setCompany(request.company().trim());
        }
        if (request.experienceYears() != null) {
            pricing.setExperienceYears(request.experienceYears());
        }
        if (request.expertiseTags() != null) {
            pricing.setExpertiseTags(request.expertiseTags().trim());
        }
        if (request.linkedinUrl() != null) {
            pricing.setLinkedinUrl(request.linkedinUrl().trim());
        }
        pricing.setStatus("ACTIVE");
        return toPricingResponse(pricingRepository.save(pricing));
    }

    @Transactional
    public MentorPricing ensureDefaultPricing(UUID mentorId, MentorProfile profile) {
        return pricingRepository.findById(mentorId).orElseGet(() -> {
            MentorPricing pricing = new MentorPricing();
            pricing.setMentorId(mentorId);
            long videoPerMinute = 2500;
            if (profile != null && profile.getHourlyRateCents() != null && profile.getHourlyRateCents() > 0) {
                videoPerMinute = Math.max(500, profile.getHourlyRateCents() / 60L);
            }
            pricing.setVideoPricePerMinuteCents(videoPerMinute);
            pricing.setAudioPricePerMinuteCents(Math.max(500, Math.round(videoPerMinute * 0.75)));
            pricing.setDesignation(profile != null ? profile.getHeadline() : null);
            pricing.setExpertiseTags("Java,Spring Boot,System Design");
            pricing.setExperienceYears(5);
            pricing.setCompany("DevConnect");
            pricing.setInstantCallEnabled(true);
            pricing.setStatus("ACTIVE");
            if (profile != null) {
                pricing.setSessionsCompleted(profile.getRatingCount());
            }
            return pricingRepository.save(pricing);
        });
    }

    /** @deprecated use {@link #ensureDefaultPricing(UUID, MentorProfile)} */
    @Transactional
    public MentorPricing ensureDefaultPricing(UUID mentorId, String headline) {
        MentorProfile profile = profileRepository.findById(mentorId).orElse(null);
        if (profile == null && headline != null) {
            profile = new MentorProfile();
            profile.setUserId(mentorId);
            profile.setHeadline(headline);
        }
        return ensureDefaultPricing(mentorId, profile);
    }

    private MentorPricing requirePricing(UUID mentorId) {
        return pricingRepository.findById(mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pricing not configured"));
    }

    private MarketplaceMentorCardResponse toCard(MentorPricing pricing) {
        MentorProfile profile = profileRepository.findById(pricing.getMentorId()).orElse(null);
        if (profile == null || !profile.isVerified()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor not available");
        }

        String displayName = firstNonBlank(
            profile.getFullName(),
            applicationRepository.findByUserId(pricing.getMentorId())
                .map(MentorApplication::getUsername)
                .orElse(null),
            displayNameFromHeadline(profile.getHeadline())
        );

        String profileImage = profile.getProfileImageUrl();
        String availability = resolveAvailability(profile, pricing);
        List<String> tags = parseTags(pricing.getExpertiseTags());
        if (tags.isEmpty() && profile.getExpertiseTags() != null) {
            tags = parseTags(profile.getExpertiseTags());
        }
        List<String> categories = deriveCategories(tags);
        long sessions = pricing.getSessionsCompleted() > 0
            ? pricing.getSessionsCompleted()
            : profile.getSessionsCompleted() > 0 ? profile.getSessionsCompleted() : profile.getRatingCount();
        int responseMinutes = profile.getResponseRate() >= 95 ? 5 : profile.getResponseRate() >= 85 ? 10 : 15;

        return new MarketplaceMentorCardResponse(
            pricing.getMentorId(),
            displayName,
            profileImage,
            firstNonBlank(pricing.getDesignation(), profile.getDesignation(), profile.getHeadline(), "Senior Engineer"),
            firstNonBlank(pricing.getCompany(), profile.getCompany(), "DevConnect"),
            pricing.getExperienceYears() != null ? pricing.getExperienceYears()
                : parseExperienceYears(profile.getExperienceRange()),
            tags,
            categories,
            profile.getAverageRating(),
            profile.getRatingCount(),
            sessions,
            responseMinutes,
            pricing.getAudioPricePerMinuteCents(),
            pricing.getVideoPricePerMinuteCents(),
            pricing.getCurrency(),
            availability,
            pricing.isInstantCallEnabled(),
            profile.isVerified(),
            profile.getBio(),
            pricing.getLinkedinUrl(),
            profile.getLocation()
        );
    }

    private Integer parseExperienceYears(String range) {
        if (range == null || range.isBlank()) return null;
        try {
            String digits = range.replaceAll("[^0-9]", " ").trim().split("\\s+")[0];
            return Integer.parseInt(digits);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<String> deriveCategories(List<String> tags) {
        List<String> categories = new java.util.ArrayList<>();
        for (String tag : tags) {
            String lower = tag.toLowerCase();
            if (lower.contains("java") || lower.contains("spring")) categories.add("Java Mentor");
            if (lower.contains("react") || lower.contains("frontend")) categories.add("React Mentor");
            if (lower.contains("system") || lower.contains("design")) categories.add("System Design Mentor");
            if (lower.contains("interview") || lower.contains("mock")) categories.add("Mock Interview Expert");
            if (lower.contains("career")) categories.add("Career Coach");
        }
        if (categories.isEmpty()) {
            categories.add("Interview Expert");
        }
        return categories.stream().distinct().limit(4).toList();
    }

    private MentorPricingResponse toPricingResponse(MentorPricing pricing) {
        return new MentorPricingResponse(
            pricing.getMentorId(),
            pricing.getAudioPricePerMinuteCents(),
            pricing.getVideoPricePerMinuteCents(),
            pricing.getCurrency(),
            pricing.isInstantCallEnabled(),
            pricing.getStatus(),
            pricing.getDesignation(),
            pricing.getCompany(),
            pricing.getExperienceYears(),
            pricing.getExpertiseTags(),
            pricing.getLinkedinUrl(),
            pricing.getSessionsCompleted(),
            pricing.getUpdatedAt()
        );
    }

    private String resolveAvailability(MentorProfile profile, MentorPricing pricing) {
        if (!profile.isAvailable() || profile.isVacationMode() || !pricing.isInstantCallEnabled()) {
            return "OFFLINE";
        }
        return "AVAILABLE";
    }

    private List<String> parseTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    private String displayNameFromHeadline(String headline) {
        if (headline == null || headline.isBlank()) {
            return "Mentor";
        }
        String name = headline.split("—|–|-")[0].trim();
        return name.isBlank() ? headline.trim() : name;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
