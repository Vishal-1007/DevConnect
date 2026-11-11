package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.ApplyMentorRequest;
import com.developersconnect.mentor.dto.MentorAccessResponse;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.MentorProfileResponse;
import com.developersconnect.mentor.dto.MentorProfileSettingsResponse;
import com.developersconnect.mentor.dto.ReviewApplicationRequest;
import com.developersconnect.mentor.dto.UpdateMentorProfileSettingsRequest;
import com.developersconnect.mentor.dto.UpsertMentorProfileRequest;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorStudentRecord;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorStudentRecordRepository;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorProfileService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorApplicationRepository mentorApplicationRepository;
    private final MentorStudentRecordRepository studentRecordRepository;
    private final MentorMarketplaceService marketplaceService;
    private final MentorApplicationService applicationService;
    private final AdminMentorService adminMentorService;

    public MentorProfileService(
        MentorProfileRepository mentorProfileRepository,
        MentorApplicationRepository mentorApplicationRepository,
        MentorStudentRecordRepository studentRecordRepository,
        @Lazy MentorMarketplaceService marketplaceService,
        MentorApplicationService applicationService,
        @Lazy AdminMentorService adminMentorService
    ) {
        this.mentorProfileRepository = mentorProfileRepository;
        this.mentorApplicationRepository = mentorApplicationRepository;
        this.studentRecordRepository = studentRecordRepository;
        this.marketplaceService = marketplaceService;
        this.applicationService = applicationService;
        this.adminMentorService = adminMentorService;
    }

    // ── Public mentor listing ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MentorProfileResponse> listAvailable() {
        return mentorProfileRepository.findAllByAvailableTrueOrderByAverageRatingDesc().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /** Admin: list ALL mentors regardless of availability. */
    @Transactional(readOnly = true)
    public List<MentorProfileResponse> listAll() {
        return mentorProfileRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MentorProfileResponse get(UUID userId) {
        MentorProfile profile = mentorProfileRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
        return toResponse(profile);
    }

    @Transactional
    public MentorProfileResponse upsert(UUID userId, UpsertMentorProfileRequest request) {
        MentorAccessResponse access = getMentorAccess(userId);
        if (!access.canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, access.message());
        }

        MentorProfile profile = mentorProfileRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
        if (request.headline() != null) profile.setHeadline(request.headline());
        if (request.bio() != null) profile.setBio(request.bio());
        if (request.hourlyRateCents() != null) profile.setHourlyRateCents(request.hourlyRateCents());
        if (request.available() != null) profile.setAvailable(request.available());
        return toResponse(mentorProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public MentorProfileSettingsResponse getMyProfileSettings(UUID userId) {
        requireMentorWorkspaceAccess(userId);
        MentorProfile profile = requireProfile(userId);
        return toSettingsResponse(profile);
    }

    @Transactional
    public MentorProfileSettingsResponse updateMyProfileSettings(UUID userId, UpdateMentorProfileSettingsRequest request) {
        requireMentorWorkspaceAccess(userId);
        MentorProfile profile = requireProfile(userId);

        if (request.fullName() != null) profile.setFullName(trimToNull(request.fullName()));
        if (request.email() != null) profile.setEmail(trimToNull(request.email()));
        if (request.phone() != null) profile.setPhone(trimToNull(request.phone()));
        if (request.profileImageUrl() != null) profile.setProfileImageUrl(trimToNull(request.profileImageUrl()));
        if (request.professionalTitle() != null) profile.setHeadline(trimToNull(request.professionalTitle()));
        if (request.currentCompany() != null) profile.setCompany(trimToNull(request.currentCompany()));
        if (request.currentRole() != null) profile.setDesignation(trimToNull(request.currentRole()));
        if (request.totalExperience() != null) profile.setExperienceRange(trimToNull(request.totalExperience()));
        if (request.bio() != null) profile.setBio(trimToNull(request.bio()));
        if (request.skills() != null) profile.setExpertiseTags(joinTags(request.skills()));
        if (request.technologies() != null) profile.setTechnologies(joinTags(request.technologies()));
        if (request.mentorshipCategories() != null) profile.setMentorshipCategories(joinTags(request.mentorshipCategories()));
        if (request.sessionDurationMinutes() != null) profile.setSessionDurationMinutes(request.sessionDurationMinutes());
        if (request.hourlyRateCents() != null) profile.setHourlyRateCents(request.hourlyRateCents());
        if (request.mockInterviewPriceCents() != null) profile.setMockInterviewPriceCents(request.mockInterviewPriceCents());
        if (request.resumeReviewPriceCents() != null) profile.setResumeReviewPriceCents(request.resumeReviewPriceCents());
        if (request.freeSessionAllowed() != null) profile.setFreeSessionAllowed(request.freeSessionAllowed());
        if (request.available() != null) profile.setAvailable(request.available());
        if (request.linkedinUrl() != null) profile.setLinkedinUrl(trimToNull(request.linkedinUrl()));
        if (request.githubUrl() != null) profile.setGithubUrl(trimToNull(request.githubUrl()));
        if (request.portfolioUrl() != null) profile.setPortfolioUrl(trimToNull(request.portfolioUrl()));

        return toSettingsResponse(mentorProfileRepository.save(profile));
    }

    // ── Application flow ─────────────────────────────────────────────────────

    /** User submits (or re-submits) a mentor application. */
    @Transactional
    public MentorApplicationResponse applyForMentorship(UUID userId, String username, ApplyMentorRequest request) {
        // If user is already an approved mentor, reject the call
        if (mentorProfileRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        MentorApplication application = mentorApplicationRepository.findByUserId(userId)
            .orElseGet(() -> {
                MentorApplication a = new MentorApplication();
                a.setUserId(userId);
                return a;
            });

        if (application.getId() != null && application.getStatus() == MentorApplication.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application already pending review");
        }
        if (application.getStatus() == MentorApplication.Status.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        application.setUsername(username);
        application.setHeadline(request.headline());
        application.setBio(request.bio());
        application.setHourlyRateCents(request.hourlyRateCents());
        application.setMotivation(request.motivation());
        application.setStatus(MentorApplication.Status.PENDING);
        application.setReviewedBy(null);
        application.setReviewNote(null);

        return applicationService.toApplicationResponse(mentorApplicationRepository.save(application));
    }

    /** Get the current user's own application status. */
    @Transactional(readOnly = true)
    public MentorApplicationResponse getMyApplication(UUID userId) {
        MentorApplication app = mentorApplicationRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No application found"));
        return applicationService.toApplicationResponse(app);
    }

    /** Whether the user may access the mentor workspace (approved + active profile). */
    @Transactional(readOnly = true)
    public MentorAccessResponse getMentorAccess(UUID userId) {
        return mentorApplicationRepository.findByUserId(userId)
            .map(app -> resolveMentorAccess(app))
            .orElseGet(() -> new MentorAccessResponse(
                false,
                null,
                false,
                "You have not applied to become a mentor yet."
            ));
    }

    private MentorAccessResponse resolveMentorAccess(MentorApplication app) {
        String status = app.getStatus().name();

        if (app.getStatus() == MentorApplication.Status.DRAFT) {
            return new MentorAccessResponse(
                false,
                status,
                false,
                "Complete and submit your mentor application to access the workspace."
            );
        }

        if (app.getStatus() == MentorApplication.Status.REJECTED) {
            return new MentorAccessResponse(
                false,
                status,
                false,
                "Your mentor application was not approved."
            );
        }

        if (app.getStatus() == MentorApplication.Status.PENDING) {
            return new MentorAccessResponse(
                false,
                status,
                false,
                "Your mentor application is pending admin approval."
            );
        }

        MentorProfile profile = mentorProfileRepository.findById(app.getUserId()).orElse(null);
        if (profile == null || !profile.isVerified()) {
            return new MentorAccessResponse(
                false,
                status,
                false,
                "Your mentor profile is not active yet."
            );
        }

        if (!profile.isAvailable()) {
            return new MentorAccessResponse(
                false,
                status,
                true,
                "Your mentor account has been blocked by an administrator."
            );
        }

        return new MentorAccessResponse(true, status, false, "Approved mentor");
    }

    /** Admin: list all applications. */
    @Transactional(readOnly = true)
    public List<MentorApplicationResponse> listAllApplications() {
        return mentorApplicationRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(applicationService::toApplicationResponse)
            .collect(Collectors.toList());
    }

    /** Admin: approve an application — creates the mentor profile. */
    @Transactional
    public MentorApplicationResponse approveApplication(UUID applicationId, String adminUsername, ReviewApplicationRequest request) {
        MentorApplication app = mentorApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        if (app.getStatus() != MentorApplication.Status.PENDING
            && app.getStatus() != MentorApplication.Status.INFO_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application is not in PENDING state");
        }

        app.setStatus(MentorApplication.Status.APPROVED);
        app.setReviewedBy(adminUsername);
        app.setReviewNote(request != null ? request.reviewNote() : null);
        mentorApplicationRepository.save(app);

        MentorProfile profile;
        if (!mentorProfileRepository.existsById(app.getUserId())) {
            profile = new MentorProfile();
            profile.setUserId(app.getUserId());
            profile.setAverageRating(0);
            profile.setRatingCount(0);
        } else {
            profile = mentorProfileRepository.findById(app.getUserId()).orElseThrow();
        }
        adminMentorService.applyProfileFromApplication(profile, app);
        mentorProfileRepository.save(profile);
        marketplaceService.ensureDefaultPricing(app.getUserId(), profile);
        applicationService.applyPricingFromApplication(app.getUserId(), app);

        return applicationService.toApplicationResponse(app);
    }

    /** Admin: block a mentor (sets available = false). */
    @Transactional
    public MentorProfileResponse blockMentor(UUID mentorUserId) {
        MentorProfile profile = mentorProfileRepository.findById(mentorUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
        profile.setAvailable(false);
        profile.setAdminStatus("BLOCKED");
        return toResponse(mentorProfileRepository.save(profile));
    }

    /** Admin: unblock a mentor (sets available = true). */
    @Transactional
    public MentorProfileResponse unblockMentor(UUID mentorUserId) {
        MentorProfile profile = mentorProfileRepository.findById(mentorUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
        profile.setAvailable(true);
        profile.setAdminStatus("ACTIVE");
        return toResponse(mentorProfileRepository.save(profile));
    }

    /** Admin: reject an application. */
    @Transactional
    public MentorApplicationResponse rejectApplication(UUID applicationId, String adminUsername, ReviewApplicationRequest request) {
        MentorApplication app = mentorApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));

        if (app.getStatus() != MentorApplication.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application is not in PENDING state");
        }

        app.setStatus(MentorApplication.Status.REJECTED);
        app.setReviewedBy(adminUsername);
        app.setReviewNote(request != null ? request.reviewNote() : null);
        return applicationService.toApplicationResponse(mentorApplicationRepository.save(app));
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private void requireMentorWorkspaceAccess(UUID userId) {
        MentorAccessResponse access = getMentorAccess(userId);
        if (!access.canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, access.message());
        }
    }

    private MentorProfile requireProfile(UUID userId) {
        return mentorProfileRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mentor profile not found"));
    }

    private MentorProfileSettingsResponse toSettingsResponse(MentorProfile profile) {
        long studentsMentored = studentRecordRepository.countByMentorIdAndStatus(
            profile.getUserId(),
            MentorStudentRecord.STATUS_ACTIVE
        );
        return new MentorProfileSettingsResponse(
            profile.getUserId(),
            profile.getFullName(),
            profile.getEmail(),
            profile.getPhone(),
            profile.getProfileImageUrl(),
            profile.getHeadline(),
            profile.getCompany(),
            profile.getDesignation(),
            profile.getExperienceRange(),
            profile.getBio(),
            splitTags(profile.getExpertiseTags()),
            splitTags(profile.getTechnologies()),
            splitTags(profile.getMentorshipCategories()),
            profile.getSessionDurationMinutes() != null ? profile.getSessionDurationMinutes() : 60,
            profile.getHourlyRateCents(),
            profile.getMockInterviewPriceCents(),
            profile.getResumeReviewPriceCents(),
            profile.isFreeSessionAllowed(),
            profile.isAvailable(),
            profile.getLinkedinUrl(),
            profile.getGithubUrl(),
            profile.getPortfolioUrl(),
            profile.getAverageRating(),
            profile.getRatingCount(),
            profile.getSessionsCompleted(),
            studentsMentored,
            profile.getUpdatedAt()
        );
    }

    private List<String> splitTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        return tags.stream()
            .map(s -> s == null ? "" : s.trim())
            .filter(s -> !s.isEmpty())
            .collect(Collectors.joining(", "));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private MentorProfileResponse toResponse(MentorProfile profile) {
        return new MentorProfileResponse(
            profile.getUserId(),
            profile.getHeadline(),
            profile.getBio(),
            profile.getHourlyRateCents(),
            profile.isVerified(),
            profile.isAvailable(),
            profile.getAverageRating(),
            profile.getRatingCount(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
