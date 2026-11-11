package com.developersconnect.matching;

import com.developersconnect.matching.dto.LiveMatchActionRequest;
import com.developersconnect.matching.dto.LiveMatchAssignmentResponse;
import com.developersconnect.matching.dto.LiveMatchStatusResponse;
import com.developersconnect.matching.security.AuthPrincipal;
import com.developersconnect.matching.service.LiveMatchingService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matching/live")
public class LiveMatchingController {

    private final LiveMatchingService liveMatchingService;

    public LiveMatchingController(LiveMatchingService liveMatchingService) {
        this.liveMatchingService = liveMatchingService;
    }

    @PostMapping("/mentor/enable")
    public ResponseEntity<LiveMatchStatusResponse> mentorEnable(
        Authentication authentication,
        @Valid @RequestBody LiveMatchActionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.mentorGoLive(principal.accountId(), request));
    }

    @PostMapping("/mentor/disable")
    public ResponseEntity<LiveMatchStatusResponse> mentorDisable(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.mentorGoOffline(principal.accountId()));
    }

    @PostMapping("/learner/search")
    public ResponseEntity<LiveMatchStatusResponse> learnerSearch(
        Authentication authentication,
        @Valid @RequestBody LiveMatchActionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.learnerSearch(principal.accountId(), request));
    }

    @GetMapping("/status")
    public ResponseEntity<LiveMatchStatusResponse> status(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.getStatus(principal.accountId()));
    }

    @PostMapping("/assignments/{id}/accept")
    public ResponseEntity<LiveMatchAssignmentResponse> accept(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.acceptAssignment(principal.accountId(), id));
    }

    @PostMapping("/assignments/{id}/reject")
    public ResponseEntity<LiveMatchAssignmentResponse> reject(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.rejectAssignment(principal.accountId(), id));
    }

    @PostMapping("/cancel")
    public ResponseEntity<LiveMatchStatusResponse> cancel(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.cancel(principal.accountId()));
    }

    @PostMapping("/end")
    public ResponseEntity<LiveMatchStatusResponse> end(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(liveMatchingService.endSession(principal.accountId()));
    }
}
