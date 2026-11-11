package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateMentorshipRequestDto;
import com.developersconnect.mentor.dto.MentorshipRequestResponse;
import com.developersconnect.mentor.dto.MyMentorSummaryResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.security.RoleUtils;
import com.developersconnect.mentor.service.MentorshipRequestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentorship")
public class MentorshipController {

    private final MentorshipRequestService mentorshipRequestService;

    public MentorshipController(MentorshipRequestService mentorshipRequestService) {
        this.mentorshipRequestService = mentorshipRequestService;
    }

    @PostMapping("/request")
    public ResponseEntity<MentorshipRequestResponse> create(
        Authentication authentication,
        @Valid @RequestBody CreateMentorshipRequestDto request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mentorshipRequestService.createRequest(
                principal.accountId(),
                principal.username(),
                request
            )
        );
    }

    /** Learner: all sent requests with status history. */
    @GetMapping("/my-requests")
    public ResponseEntity<List<MentorshipRequestResponse>> myRequests(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorshipRequestService.listForLearner(principal.accountId()));
    }

    /** Legacy list — mentor sees incoming, learner sees outgoing. Prefer dedicated endpoints. */
    @GetMapping("/requests")
    public ResponseEntity<List<MentorshipRequestResponse>> list(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        if (RoleUtils.hasRole(principal, "MENTOR")) {
            return ResponseEntity.ok(mentorshipRequestService.listForMentor(principal.accountId()));
        }
        return ResponseEntity.ok(mentorshipRequestService.listForLearner(principal.accountId()));
    }

    /** Learner: accepted mentors available for pair programming and mentorship. */
    @GetMapping("/my-mentors")
    public ResponseEntity<List<MyMentorSummaryResponse>> myMentors(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorshipRequestService.listAcceptedMentorsForLearner(principal.accountId()));
    }

    /** Validate active mentor-student relationship for the authenticated learner. */
    @GetMapping("/relationship/active")
    public ResponseEntity<Map<String, Boolean>> activeRelationship(
        Authentication authentication,
        @RequestParam UUID mentorId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        boolean active = mentorshipRequestService.hasActiveRelationship(mentorId, principal.accountId());
        return ResponseEntity.ok(Map.of("active", active));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<MentorshipRequestResponse> acceptById(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorshipRequestService.accept(principal.accountId(), id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<MentorshipRequestResponse> rejectById(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorshipRequestService.reject(principal.accountId(), id));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<MentorshipRequestResponse> accept(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        return acceptById(authentication, id);
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<MentorshipRequestResponse> reject(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        return rejectById(authentication, id);
    }
}
