package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.AdminMentorDetailResponse;
import com.developersconnect.mentor.dto.AdminMentorListResponse;
import com.developersconnect.mentor.dto.MentorApplicationDataDto;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorPricing;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorPricingRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminMentorService {

    private final MentorProfileRepository profileRepository;
    private final MentorPricingRepository pricingRepository;
    private final MentorApplicationRepository applicationRepository;
    private final MentorApplicationService applicationService;

    public AdminMentorService(
        MentorProfileRepository profileRepository,
        MentorPricingRepository pricingRepository,
        MentorApplicationRepository applicationRepository,
        MentorApplicationService applicationService
    ) {
        this.profileRepository = profileRepository;
        this.pricingRepository = pricingRepository;
        this.applicationRepository = applicationRepository;
        this.applicationService = applicationService;
    }

    @Transactional(readOnly = true)
    public List<AdminMentorListResponse> listForAdmin() {
        return profileRepository.findAll().stream()
            .map(this::toListResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminMentorDetailResponse getForAdmin(UUID mentorUserId) {
        MentorProfile profile = requireProfile(mentorUserId);
        return toDetailResponse(profile);
    }

    @Transactional
    public AdminMentorDetailResponse suspendMentor(UUID mentorUserId) {
        MentorProfile profile = requireProfile(mentorUserId);
        profile.setAdminStatus("SUSPENDED");
        profile.setAvailable(false);
        pricingRepository.findById(mentorUserId).ifPresent(pricing -> {
            pricing.setStatus("SUSPENDED");
            pricingRepository.save(pricing);
        });
        return toDetailResponse(profileRepository.save(profile));
    }

    public void applyProfileFromApplication(MentorProfile profile, MentorApplication application) {
        MentorApplicationDataDto data = applicationService.deserialize(application.getApplicationData());
        if (data == null) {
            if (profile.getHeadline() == null) {
                profile.setHeadline(application.getHeadline());
            }
            if (profile.getBio() == null) {
                profile.setBio(application.getBio());
            }
            if (profile.getHourlyRateCents() == null) {
                profile.setHourlyRateCents(application.getHourlyRateCents());
            }
            return;
        }

        if (data.fullName() != null && !data.fullName().isBlank()) {
            profile.setFullName(data.fullName().trim());
        }
        if (data.headline() != null && !data.headline().isBlank()) {
            profile.setHeadline(data.headline().trim());
        } else if (application.getHeadline() != null) {
            profile.setHeadline(application.getHeadline());
        }
        if (data.profilePictureUrl() != null && !data.profilePictureUrl().isBlank()) {
            profile.setProfileImageUrl(data.profilePictureUrl().trim());
        }
        if (data.company() != null) {
            profile.setCompany(data.company().trim());
        }
        if (data.designation() != null) {
            profile.setDesignation(data.designation().trim());
        }
        if (data.experienceRange() != null) {
            profile.setExperienceRange(data.experienceRange().trim());
        }
        if (data.location() != null) {
            profile.setLocation(data.location().trim());
        }
        if (data.bio() != null) {
            profile.setBio(data.bio().trim());
        } else if (application.getBio() != null) {
            profile.setBio(application.getBio());
        }
        if (data.skills() != null && !data.skills().isEmpty()) {
            profile.setExpertiseTags(String.join(",", data.skills()));
        }
        if (data.linkedinUrl() != null) {
            profile.setLinkedinUrl(data.linkedinUrl().trim());
        }
        if (data.githubUrl() != null) {
            profile.setGithubUrl(data.githubUrl().trim());
        }
        if (data.portfolioUrl() != null) {
            profile.setPortfolioUrl(data.portfolioUrl().trim());
        }
        if (data.resumeUrl() != null) {
            profile.setResumeUrl(data.resumeUrl().trim());
        }
        if (data.mockInterviewPriceCents() != null) {
            profile.setMockInterviewPriceCents(Math.toIntExact(data.mockInterviewPriceCents()));
        }
        if (data.resumeReviewPriceCents() != null) {
            profile.setResumeReviewPriceCents(Math.toIntExact(data.resumeReviewPriceCents()));
        }
        if (data.videoPricePerMinuteCents() != null && data.videoPricePerMinuteCents() > 0) {
            profile.setHourlyRateCents(Math.toIntExact(data.videoPricePerMinuteCents() * 60));
        } else if (application.getHourlyRateCents() != null) {
            profile.setHourlyRateCents(application.getHourlyRateCents());
        }
        profile.setVerified(true);
        profile.setAvailable(true);
        profile.setAdminStatus("ACTIVE");
    }

    private MentorProfile requireProfile(UUID id) {
        return profileRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
    }

    private AdminMentorListResponse toListResponse(MentorProfile profile) {
        MentorPricing pricing = pricingRepository.findById(profile.getUserId()).orElse(null);
        MentorApplicationDataDto appData = findApprovedApplicationData(profile.getUserId());

        String fullName = firstNonBlank(profile.getFullName(), appData != null ? appData.fullName() : null, parseNameFromHeadline(profile.getHeadline()));
        String profileImage = firstNonBlank(profile.getProfileImageUrl(), appData != null ? appData.profilePictureUrl() : null);
        String company = firstNonBlank(profile.getCompany(), pricing != null ? pricing.getCompany() : null, appData != null ? appData.company() : null);
        String designation = firstNonBlank(profile.getDesignation(), pricing != null ? pricing.getDesignation() : null, appData != null ? appData.designation() : null);
        String experience = firstNonBlank(
            profile.getExperienceRange(),
            pricing != null && pricing.getExperienceYears() != null ? pricing.getExperienceYears() + " Years" : null,
            appData != null ? appData.experienceRange() : null
        );
        long sessions = profile.getSessionsCompleted() > 0
            ? profile.getSessionsCompleted()
            : pricing != null ? pricing.getSessionsCompleted() : profile.getRatingCount();

        Long audio = pricing != null ? pricing.getAudioPricePerMinuteCents() : null;
        Long video = pricing != null ? pricing.getVideoPricePerMinuteCents() : null;
        if (audio == null && appData != null && appData.audioPricePerMinuteCents() != null) {
            audio = appData.audioPricePerMinuteCents();
        }
        if (video == null && appData != null && appData.videoPricePerMinuteCents() != null) {
            video = appData.videoPricePerMinuteCents();
        }

        return new AdminMentorListResponse(
            profile.getUserId(),
            fullName,
            profileImage,
            profile.getHeadline(),
            company,
            designation,
            experience,
            profile.isVerified(),
            profile.getAverageRating(),
            profile.getRatingCount(),
            sessions,
            audio,
            video,
            profile.getHourlyRateCents(),
            resolveStatus(profile),
            profile.getCreatedAt()
        );
    }

    private AdminMentorDetailResponse toDetailResponse(MentorProfile profile) {
        MentorPricing pricing = pricingRepository.findById(profile.getUserId()).orElse(null);
        MentorApplicationDataDto appData = findApprovedApplicationData(profile.getUserId());

        String fullName = firstNonBlank(profile.getFullName(), appData != null ? appData.fullName() : null, parseNameFromHeadline(profile.getHeadline()));
        String profileImage = firstNonBlank(profile.getProfileImageUrl(), appData != null ? appData.profilePictureUrl() : null);
        String company = firstNonBlank(profile.getCompany(), pricing != null ? pricing.getCompany() : null, appData != null ? appData.company() : null);
        String designation = firstNonBlank(profile.getDesignation(), pricing != null ? pricing.getDesignation() : null, appData != null ? appData.designation() : null);
        String experience = firstNonBlank(
            profile.getExperienceRange(),
            pricing != null && pricing.getExperienceYears() != null ? pricing.getExperienceYears() + " Years" : null,
            appData != null ? appData.experienceRange() : null
        );
        String location = firstNonBlank(profile.getLocation(), appData != null ? appData.location() : null);
        List<String> skills = parseSkills(profile.getExpertiseTags(), pricing, appData);

        long sessions = profile.getSessionsCompleted() > 0
            ? profile.getSessionsCompleted()
            : pricing != null ? pricing.getSessionsCompleted() : profile.getRatingCount();

        Long audio = pricing != null ? pricing.getAudioPricePerMinuteCents() : null;
        Long video = pricing != null ? pricing.getVideoPricePerMinuteCents() : null;
        if (audio == null && appData != null && appData.audioPricePerMinuteCents() != null) {
            audio = appData.audioPricePerMinuteCents();
        }
        if (video == null && appData != null && appData.videoPricePerMinuteCents() != null) {
            video = appData.videoPricePerMinuteCents();
        }

        Integer mockInterview = profile.getMockInterviewPriceCents();
        if (mockInterview == null && appData != null && appData.mockInterviewPriceCents() != null) {
            mockInterview = Math.toIntExact(appData.mockInterviewPriceCents());
        }
        Integer resumeReview = profile.getResumeReviewPriceCents();
        if (resumeReview == null && appData != null && appData.resumeReviewPriceCents() != null) {
            resumeReview = Math.toIntExact(appData.resumeReviewPriceCents());
        }

        long revenue = sessions * (video != null ? video * 30L : profile.getHourlyRateCents() != null ? profile.getHourlyRateCents() : 0L);

        Long mockInterviewLong = mockInterview != null ? mockInterview.longValue() : null;
        Long resumeReviewLong = resumeReview != null ? resumeReview.longValue() : null;

        return new AdminMentorDetailResponse(
            profile.getUserId(),
            fullName,
            profileImage,
            profile.getHeadline(),
            profile.getBio(),
            company,
            designation,
            experience,
            location,
            profile.isVerified(),
            profile.getAverageRating(),
            profile.getRatingCount(),
            sessions,
            profile.getResponseRate(),
            Math.max(sessions / 2, profile.getRatingCount()),
            revenue,
            audio,
            video,
            mockInterviewLong,
            resumeReviewLong,
            profile.getHourlyRateCents(),
            skills,
            firstNonBlank(profile.getLinkedinUrl(), pricing != null ? pricing.getLinkedinUrl() : null, appData != null ? appData.linkedinUrl() : null),
            firstNonBlank(profile.getGithubUrl(), appData != null ? appData.githubUrl() : null),
            firstNonBlank(profile.getPortfolioUrl(), appData != null ? appData.portfolioUrl() : null),
            firstNonBlank(profile.getResumeUrl(), appData != null ? appData.resumeUrl() : null),
            resolveStatus(profile),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }

    private MentorApplicationDataDto findApprovedApplicationData(UUID userId) {
        return applicationRepository.findByUserId(userId)
            .filter(app -> app.getStatus() == MentorApplication.Status.APPROVED)
            .map(app -> applicationService.deserialize(app.getApplicationData()))
            .orElse(null);
    }

    private String resolveStatus(MentorProfile profile) {
        if ("SUSPENDED".equalsIgnoreCase(profile.getAdminStatus())) {
            return "SUSPENDED";
        }
        if (!profile.isAvailable() || "BLOCKED".equalsIgnoreCase(profile.getAdminStatus())) {
            return "BLOCKED";
        }
        return "ACTIVE";
    }

    private List<String> parseSkills(String profileTags, MentorPricing pricing, MentorApplicationDataDto appData) {
        if (profileTags != null && !profileTags.isBlank()) {
            return Arrays.stream(profileTags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        }
        if (pricing != null && pricing.getExpertiseTags() != null && !pricing.getExpertiseTags().isBlank()) {
            return Arrays.stream(pricing.getExpertiseTags().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        }
        if (appData != null && appData.skills() != null) {
            return appData.skills();
        }
        return Collections.emptyList();
    }

    private String parseNameFromHeadline(String headline) {
        if (headline == null || headline.isBlank()) {
            return "Mentor";
        }
        int dash = headline.indexOf(" — ");
        if (dash > 0) {
            return headline.substring(0, dash).trim();
        }
        int pipe = headline.indexOf(" | ");
        if (pipe > 0 && !headline.substring(0, pipe).contains("Developer") && !headline.substring(0, pipe).contains("Engineer")) {
            return headline.substring(0, pipe).trim();
        }
        if (headline.length() > 40) {
            return "Mentor";
        }
        return headline;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
