package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.MentorApplicationDataDto;
import com.developersconnect.mentor.dto.MentorApplicationDraftResponse;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.MentorApplicationUploadResponse;
import com.developersconnect.mentor.dto.SaveMentorApplicationDraftRequest;
import com.developersconnect.mentor.dto.SubmitMentorApplicationRequest;
import com.developersconnect.mentor.model.MentorApplication;
import com.developersconnect.mentor.model.MentorPricing;
import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.repository.MentorApplicationRepository;
import com.developersconnect.mentor.repository.MentorPricingRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorApplicationService {

    private static final int MIN_BIO_LENGTH = 150;

    private final MentorApplicationRepository applicationRepository;
    private final MentorProfileRepository profileRepository;
    private final MentorPricingRepository pricingRepository;
    private final StreamMediaStorageService mediaStorage;
    private final ObjectMapper objectMapper;
    private final AdminMentorApplicationService adminMentorApplicationService;

    public MentorApplicationService(
        MentorApplicationRepository applicationRepository,
        MentorProfileRepository profileRepository,
        MentorPricingRepository pricingRepository,
        StreamMediaStorageService mediaStorage,
        ObjectMapper objectMapper,
        @Lazy AdminMentorApplicationService adminMentorApplicationService
    ) {
        this.applicationRepository = applicationRepository;
        this.profileRepository = profileRepository;
        this.pricingRepository = pricingRepository;
        this.mediaStorage = mediaStorage;
        this.objectMapper = objectMapper;
        this.adminMentorApplicationService = adminMentorApplicationService;
    }

    @Transactional(readOnly = true)
    public MentorApplicationDraftResponse getDraft(UUID userId) {
        MentorApplication app = applicationRepository.findByUserId(userId)
            .filter(a -> a.getStatus() == MentorApplication.Status.DRAFT)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No draft found"));
        return toDraftResponse(app);
    }

    @Transactional
    public MentorApplicationDraftResponse saveDraft(UUID userId, String username, SaveMentorApplicationDraftRequest request) {
        if (profileRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        MentorApplication app = applicationRepository.findByUserId(userId).orElseGet(() -> {
            MentorApplication created = new MentorApplication();
            created.setUserId(userId);
            created.setStatus(MentorApplication.Status.DRAFT);
            return created;
        });

        if (app.getStatus() == MentorApplication.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application already submitted for review");
        }
        if (app.getStatus() == MentorApplication.Status.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        app.setUsername(username);
        app.setStatus(MentorApplication.Status.DRAFT);
        app.setCurrentStep(request.currentStep());
        app.setApplicationData(serialize(request.data()));
        syncSummaryFields(app, request.data());
        return toDraftResponse(applicationRepository.save(app));
    }

    @Transactional
    public MentorApplicationResponse submit(UUID userId, String username, SubmitMentorApplicationRequest request) {
        if (profileRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        MentorApplicationDataDto data = request.data();
        validateSubmission(data);

        MentorApplication app = applicationRepository.findByUserId(userId).orElseGet(() -> {
            MentorApplication created = new MentorApplication();
            created.setUserId(userId);
            return created;
        });

        if (app.getStatus() == MentorApplication.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application already pending review");
        }
        if (app.getStatus() == MentorApplication.Status.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already an approved mentor");
        }

        app.setUsername(username);
        app.setStatus(MentorApplication.Status.PENDING);
        app.setCurrentStep(7);
        app.setApplicationData(serialize(data));
        syncSummaryFields(app, data);
        app.setReviewedBy(null);
        app.setReviewNote(null);

        MentorApplication saved = applicationRepository.save(app);
        adminMentorApplicationService.recordSubmittedTimeline(saved);
        applicationRepository.save(saved);
        return toApplicationResponse(saved);
    }

    @Transactional(readOnly = true)
    public MentorApplicationUploadResponse uploadDocument(UUID userId, String type, MultipartFile file) {
        String normalized = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        String relativePath = switch (normalized) {
            case "PROFILE" -> mediaStorage.storeMentorApplicationImage(file);
            case "RESUME" -> mediaStorage.storeMentorApplicationDocument(file);
            case "GOVERNMENT_ID" -> mediaStorage.storeMentorApplicationDocument(file);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload type");
        };
        return new MentorApplicationUploadResponse("/uploads/" + relativePath, normalized);
    }

    @Transactional
    public void applyPricingFromApplication(UUID mentorId, MentorApplication application) {
        MentorApplicationDataDto data = deserialize(application.getApplicationData());
        if (data == null) {
            return;
        }
        MentorPricing pricing = pricingRepository.findById(mentorId).orElseGet(() -> {
            MentorPricing created = new MentorPricing();
            created.setMentorId(mentorId);
            return created;
        });
        if (data.audioPricePerMinuteCents() != null) {
            pricing.setAudioPricePerMinuteCents(data.audioPricePerMinuteCents());
        }
        if (data.videoPricePerMinuteCents() != null) {
            pricing.setVideoPricePerMinuteCents(data.videoPricePerMinuteCents());
        }
        if (data.designation() != null) {
            pricing.setDesignation(data.designation());
        }
        if (data.company() != null) {
            pricing.setCompany(data.company());
        }
        if (data.skills() != null && !data.skills().isEmpty()) {
            pricing.setExpertiseTags(String.join(",", data.skills()));
        }
        if (data.experienceRange() != null) {
            pricing.setExperienceYears(parseExperienceYears(data.experienceRange()));
        }
        pricing.setInstantCallEnabled(data.instantCallEnabled() == null || data.instantCallEnabled());
        pricing.setStatus("ACTIVE");
        pricingRepository.save(pricing);
    }

    public MentorApplicationDataDto deserialize(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, MentorApplicationDataDto.class);
        } catch (JsonProcessingException ex) {
            return null;
        }
    }

    public MentorApplicationResponse toApplicationResponse(MentorApplication app) {
        return new MentorApplicationResponse(
            app.getId(),
            app.getUserId(),
            app.getUsername(),
            app.getHeadline(),
            app.getBio(),
            app.getHourlyRateCents(),
            app.getMotivation(),
            app.getStatus().name(),
            app.getReviewedBy(),
            app.getReviewNote(),
            app.getCurrentStep(),
            deserialize(app.getApplicationData()),
            app.getCreatedAt(),
            app.getUpdatedAt()
        );
    }

    private MentorApplicationDraftResponse toDraftResponse(MentorApplication app) {
        return new MentorApplicationDraftResponse(
            app.getId(),
            app.getUserId(),
            app.getCurrentStep() != null ? app.getCurrentStep() : 1,
            deserialize(app.getApplicationData()),
            app.getStatus().name(),
            app.getUpdatedAt()
        );
    }

    private void syncSummaryFields(MentorApplication app, MentorApplicationDataDto data) {
        if (data == null) {
            return;
        }
        if (data.headline() != null && !data.headline().isBlank()) {
            app.setHeadline(data.headline().trim());
        } else if (data.fullName() != null && !data.fullName().isBlank()) {
            app.setHeadline(data.fullName().trim());
        }
        if (data.bio() != null) {
            app.setBio(data.bio().trim());
        }
        if (data.videoPricePerMinuteCents() != null && data.videoPricePerMinuteCents() > 0) {
            app.setHourlyRateCents(Math.toIntExact(data.videoPricePerMinuteCents() * 60));
        } else if (data.mockInterviewPriceCents() != null && data.mockInterviewPriceCents() > 0) {
            app.setHourlyRateCents(Math.toIntExact(data.mockInterviewPriceCents()));
        }
        String motivation = buildMotivation(data);
        if (!motivation.isBlank()) {
            app.setMotivation(motivation);
        }
    }

    private String buildMotivation(MentorApplicationDataDto data) {
        if (data.bio() != null && data.bio().length() >= 80) {
            return data.bio().trim();
        }
        StringBuilder sb = new StringBuilder("Mentor application: ");
        if (data.fullName() != null) {
            sb.append(data.fullName()).append(" — ");
        }
        if (data.designation() != null) {
            sb.append(data.designation());
        }
        if (data.company() != null) {
            sb.append(" @ ").append(data.company());
        }
        if (data.skills() != null && !data.skills().isEmpty()) {
            sb.append(". Skills: ").append(String.join(", ", data.skills()));
        }
        return sb.toString().trim();
    }

    private void validateSubmission(MentorApplicationDataDto data) {
        if (data == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Application data is required");
        }
        requireText(data.fullName(), "Full name is required");
        requireText(data.headline(), "Professional headline is required");
        requireText(data.company(), "Current company is required");
        requireText(data.designation(), "Designation is required");
        requireText(data.experienceRange(), "Experience range is required");
        requireText(data.location(), "Location is required");
        requireText(data.profilePictureUrl(), "Profile picture is required");
        requireText(data.bio(), "Bio is required");
        if (data.bio().trim().length() < MIN_BIO_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bio must be at least " + MIN_BIO_LENGTH + " characters");
        }
        requireText(data.linkedinUrl(), "LinkedIn URL is required");
        requireText(data.githubUrl(), "GitHub URL is required");
        requireText(data.resumeUrl(), "Resume upload is required");
        if (data.skills() == null || data.skills().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one skill");
        }
        if (data.categories() == null || data.categories().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one mentorship category");
        }
        if (data.languages() == null || data.languages().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one language");
        }
        if (data.videoPricePerMinuteCents() == null || data.videoPricePerMinuteCents() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video call price is required");
        }
        if (data.audioPricePerMinuteCents() == null || data.audioPricePerMinuteCents() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio call price is required");
        }
        requireText(data.accountHolderName(), "Account holder name is required");
        requireText(data.bankName(), "Bank name is required");
        requireText(data.accountNumber(), "Account number is required");
        requireText(data.ifscCode(), "IFSC code is required");
        requireText(data.panNumber(), "PAN number is required");
        var agreements = data.agreements();
        if (agreements == null
            || !Boolean.TRUE.equals(agreements.accurateDetails())
            || !Boolean.TRUE.equals(agreements.mentorGuidelines())
            || !Boolean.TRUE.equals(agreements.terms())
            || !Boolean.TRUE.equals(agreements.commission())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All agreements must be accepted");
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String serialize(MentorApplicationDataDto data) {
        if (data == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid application data");
        }
    }

    private int parseExperienceYears(String range) {
        if (range == null) {
            return 5;
        }
        if (range.contains("12")) {
            return 12;
        }
        if (range.contains("8-12")) {
            return 10;
        }
        if (range.contains("5-8")) {
            return 6;
        }
        if (range.contains("2-5")) {
            return 3;
        }
        return 1;
    }
}
