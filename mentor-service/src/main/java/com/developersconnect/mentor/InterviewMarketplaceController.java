package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.InterviewMarketplaceDtos.*;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.InterviewMarketplaceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/interview-marketplace")
public class InterviewMarketplaceController {

    private final InterviewMarketplaceService marketplaceService;

    public InterviewMarketplaceController(InterviewMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    private UUID userId(Authentication auth) {
        return ((AuthPrincipal) auth.getPrincipal()).accountId();
    }

    @GetMapping("/packs")
    public InterviewPageResponse<InterviewPackCardResponse> browse(
        Authentication auth,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) UUID mentorId,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice,
        @RequestParam(required = false) Double minRating,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return marketplaceService.browseMarketplace(
            userId(auth), search, category, difficulty, mentorId, minPrice, maxPrice, minRating, page, size
        );
    }

    @GetMapping("/packs/{id}")
    public InterviewPackDetailResponse detail(
        Authentication auth,
        @PathVariable UUID id,
        @RequestParam(defaultValue = "false") boolean preview
    ) {
        return marketplaceService.getPackDetail(id, userId(auth), preview);
    }

    @PostMapping("/packs/{id}/purchase")
    public InterviewPackCardResponse purchase(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody ConfirmInterviewPackPurchaseRequest request
    ) {
        return marketplaceService.purchasePack(userId(auth), id, request.paymentId());
    }

    @PostMapping("/packs/{id}/enroll")
    public InterviewPackCardResponse enrollFree(Authentication auth, @PathVariable UUID id) {
        return marketplaceService.enrollFreePack(userId(auth), id);
    }

    @GetMapping("/purchases")
    public InterviewPageResponse<InterviewPurchaseResponse> myPurchases(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return marketplaceService.myPurchases(userId(auth), page, size);
    }

    @PostMapping("/packs/{id}/reviews")
    public InterviewPackReviewResponse review(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody CreatePackReviewRequest request
    ) {
        return marketplaceService.addReview(userId(auth), id, request);
    }

    @GetMapping("/assignments")
    public List<InterviewAssignmentCardResponse> myAssignments(Authentication auth) {
        return marketplaceService.myAssignments(userId(auth));
    }

    @GetMapping("/assignments/{id}")
    public InterviewAssignmentDetailResponse assignmentDetail(Authentication auth, @PathVariable UUID id) {
        return marketplaceService.getAssignment(userId(auth), id);
    }

    @PostMapping("/assignments/{id}/submit")
    public InterviewAssignmentDetailResponse submit(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody SubmitInterviewAnswersRequest request
    ) {
        return marketplaceService.submitAnswers(userId(auth), id, request);
    }

    @GetMapping("/feedback")
    public List<InterviewFeedbackResponse> myFeedback(Authentication auth) {
        return marketplaceService.myFeedback(userId(auth));
    }
}
