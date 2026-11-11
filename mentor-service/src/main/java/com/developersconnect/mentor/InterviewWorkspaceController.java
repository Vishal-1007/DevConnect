package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateInterviewQuestionSetRequest;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.InterviewAnalyticsResponse;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.InterviewAssignmentCardResponse;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.InterviewAssignmentDetailResponse;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.InterviewFeedbackResponse;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.InterviewPackCardResponse;
import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.SubmitInterviewFeedbackRequest;
import com.developersconnect.mentor.dto.UpdateInterviewQuestionSetRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.InterviewMarketplaceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/me/workspace/interview-packs")
public class InterviewWorkspaceController {

    private final InterviewMarketplaceService marketplaceService;

    public InterviewWorkspaceController(InterviewMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    private UUID mentorId(Authentication auth) {
        return ((AuthPrincipal) auth.getPrincipal()).accountId();
    }

    @GetMapping
    public List<InterviewPackCardResponse> listPacks(Authentication auth) {
        return marketplaceService.mentorPacks(mentorId(auth));
    }

    @PostMapping
    public InterviewPackCardResponse createPack(
        Authentication auth,
        @Valid @RequestBody CreateInterviewQuestionSetRequest request
    ) {
        return marketplaceService.createPack(mentorId(auth), request);
    }

    @PutMapping("/{id}")
    public InterviewPackCardResponse updatePack(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody UpdateInterviewQuestionSetRequest request
    ) {
        return marketplaceService.updatePack(mentorId(auth), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePack(Authentication auth, @PathVariable UUID id) {
        marketplaceService.deletePack(mentorId(auth), id);
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void duplicatePack(Authentication auth, @PathVariable UUID id) {
        marketplaceService.duplicatePack(mentorId(auth), id);
    }

    @PostMapping("/{id}/publish")
    public InterviewPackCardResponse publishInterviewPack(Authentication auth, @PathVariable UUID id) {
        return marketplaceService.publishPack(mentorId(auth), id);
    }

    @GetMapping("/assignments")
    public List<InterviewAssignmentCardResponse> assignments(
        Authentication auth,
        @RequestParam(required = false) String status
    ) {
        return marketplaceService.mentorAssignments(mentorId(auth), status);
    }

    @GetMapping("/assignments/{id}")
    public InterviewAssignmentDetailResponse assignmentDetail(Authentication auth, @PathVariable UUID id) {
        return marketplaceService.mentorAssignmentDetail(mentorId(auth), id);
    }

    @PostMapping("/assignments/{id}/feedback")
    public InterviewFeedbackResponse submitFeedback(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody SubmitInterviewFeedbackRequest request
    ) {
        return marketplaceService.submitFeedback(mentorId(auth), id, request);
    }

    @GetMapping("/analytics")
    public InterviewAnalyticsResponse analytics(Authentication auth) {
        return marketplaceService.mentorAnalytics(mentorId(auth));
    }
}
