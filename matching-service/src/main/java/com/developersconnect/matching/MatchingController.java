package com.developersconnect.matching;

import com.developersconnect.matching.dto.CreateMatchRequest;
import com.developersconnect.matching.dto.MatchRequestResponse;
import com.developersconnect.matching.dto.MatchResultResponse;
import com.developersconnect.matching.dto.UpsertMatchIndexRequest;
import com.developersconnect.matching.security.AuthPrincipal;
import com.developersconnect.matching.service.MatchIndexService;
import com.developersconnect.matching.service.MatchingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    private final MatchingService matchingService;
    private final MatchIndexService matchIndexService;

    public MatchingController(MatchingService matchingService, MatchIndexService matchIndexService) {
        this.matchingService = matchingService;
        this.matchIndexService = matchIndexService;
    }

    @PutMapping("/index")
    public ResponseEntity<java.util.Map<String, String>> upsertIndex(
        Authentication authentication,
        @Valid @RequestBody UpsertMatchIndexRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        matchIndexService.upsert(principal.accountId(), request);
        return ResponseEntity.ok(java.util.Map.of("status", "ok"));
    }

    @PostMapping("/requests")
    public ResponseEntity<MatchRequestResponse> create(
        Authentication authentication,
        @Valid @RequestBody CreateMatchRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(matchingService.createRequest(principal.accountId(), request));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<MatchRequestResponse>> list(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(matchingService.listRequests(principal.accountId()));
    }

    @GetMapping("/requests/{id}/results")
    public ResponseEntity<List<MatchResultResponse>> results(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(matchingService.listResults(principal.accountId(), id));
    }
}
