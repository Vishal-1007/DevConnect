package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateMentorFeedbackRequest;
import com.developersconnect.mentor.dto.MarketplaceMentorCardResponse;
import com.developersconnect.mentor.dto.MentorAccessResponse;
import com.developersconnect.mentor.dto.MentorFeedbackSummaryResponse;
import com.developersconnect.mentor.dto.MentorReviewResponse;
import com.developersconnect.mentor.dto.ApplyMentorRequest;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.MentorProfileResponse;
import com.developersconnect.mentor.dto.MentorProfileSettingsResponse;
import com.developersconnect.mentor.dto.ReviewApplicationRequest;
import com.developersconnect.mentor.dto.UpdateMentorProfileSettingsRequest;
import com.developersconnect.mentor.dto.UpsertMentorProfileRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorMarketplaceService;
import com.developersconnect.mentor.service.MentorPlansReviewsService;
import com.developersconnect.mentor.service.MentorProfileService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/mentors")
public class MentorController {

    private final MentorProfileService mentorProfileService;
    private final MentorMarketplaceService marketplaceService;
    private final MentorPlansReviewsService plansReviewsService;

    public MentorController(
        MentorProfileService mentorProfileService,
        MentorMarketplaceService marketplaceService,
        MentorPlansReviewsService plansReviewsService
    ) {
        this.mentorProfileService = mentorProfileService;
        this.marketplaceService = marketplaceService;
        this.plansReviewsService = plansReviewsService;
    }

    // ── Public mentor listing ────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<MentorProfileResponse>> listAvailable() {
        return ResponseEntity.ok(mentorProfileService.listAvailable());
    }

    @GetMapping("/available")
    public ResponseEntity<List<MarketplaceMentorCardResponse>> listMarketplaceAvailable() {
        return ResponseEntity.ok(marketplaceService.listAvailableMentors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MentorProfileResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(mentorProfileService.get(id));
    }

    @PutMapping("/me")
    public ResponseEntity<MentorProfileResponse> upsertMe(
        Authentication authentication,
        @Valid @RequestBody UpsertMentorProfileRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.upsert(principal.accountId(), request));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<MentorProfileSettingsResponse> getMyProfileSettings(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.getMyProfileSettings(principal.accountId()));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<MentorProfileSettingsResponse> updateMyProfileSettings(
        Authentication authentication,
        @Valid @RequestBody UpdateMentorProfileSettingsRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.updateMyProfileSettings(principal.accountId(), request));
    }

    // ── Application flow ─────────────────────────────────────────────────────

    /** Any authenticated user can submit an application to become a mentor. */
    @PostMapping("/apply")
    public ResponseEntity<MentorApplicationResponse> apply(
        Authentication authentication,
        @Valid @RequestBody ApplyMentorRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        MentorApplicationResponse response =
            mentorProfileService.applyForMentorship(principal.accountId(), principal.username(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** Get the current user's own application status. */
    @GetMapping("/my-application")
    public ResponseEntity<MentorApplicationResponse> getMyApplication(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.getMyApplication(principal.accountId()));
    }

    /** Check whether the current user can access the mentor workspace. */
    @GetMapping("/me/access")
    public ResponseEntity<MentorAccessResponse> getMyAccess(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.getMentorAccess(principal.accountId()));
    }

    /** Mentor dashboard: feedback summary for the logged-in mentor. */
    @GetMapping("/me/feedback-summary")
    public ResponseEntity<MentorFeedbackSummaryResponse> myFeedbackSummary(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.getFeedbackSummary(mentorId));
    }

    /** Mentor dashboard: feedback summary scoped to mentor ID (must match logged-in mentor). */
    @GetMapping("/{mentorId}/feedback-summary")
    public ResponseEntity<MentorFeedbackSummaryResponse> feedbackSummary(
        Authentication authentication,
        @PathVariable UUID mentorId
    ) {
        requireSelfMentor(authentication, mentorId);
        return ResponseEntity.ok(plansReviewsService.getFeedbackSummary(mentorId));
    }

    /** Student submits feedback for a mentor after an accepted mentorship relationship. */
    @PostMapping("/{mentorId}/feedback")
    public ResponseEntity<MentorReviewResponse> submitFeedback(
        Authentication authentication,
        @PathVariable UUID mentorId,
        @Valid @RequestBody CreateMentorFeedbackRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            plansReviewsService.submitFeedback(
                mentorId,
                principal.accountId(),
                principal.username(),
                request
            )
        );
    }

    private UUID principalId(Authentication authentication) {
        return ((AuthPrincipal) authentication.getPrincipal()).accountId();
    }

    private void requireSelfMentor(Authentication authentication, UUID mentorId) {
        UUID accountId = principalId(authentication);
        if (!accountId.equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only view your own feedback summary");
        }
    }

    // ── Admin endpoints ──────────────────────────────────────────────────────

    /** Admin: list all mentor applications. */
    @GetMapping("/applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MentorApplicationResponse>> listApplications() {
        return ResponseEntity.ok(mentorProfileService.listAllApplications());
    }

    /** Admin: approve a mentor application. */
    @PostMapping("/applications/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MentorApplicationResponse> approve(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody(required = false) ReviewApplicationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.approveApplication(id, principal.username(), request));
    }

    /** Admin: reject a mentor application. */
    @PostMapping("/applications/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MentorApplicationResponse> reject(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody(required = false) ReviewApplicationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorProfileService.rejectApplication(id, principal.username(), request));
    }

    /** Admin: list ALL mentor profiles (including blocked). */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MentorProfileResponse>> listAll() {
        return ResponseEntity.ok(mentorProfileService.listAll());
    }

    /** Admin: block a mentor. */
    @PostMapping("/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MentorProfileResponse> blockMentor(@PathVariable UUID id) {
        return ResponseEntity.ok(mentorProfileService.blockMentor(id));
    }

    /** Admin: unblock a mentor. */
    @PostMapping("/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MentorProfileResponse> unblockMentor(@PathVariable UUID id) {
        return ResponseEntity.ok(mentorProfileService.unblockMentor(id));
    }
}
