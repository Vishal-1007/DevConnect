package com.developersconnect.user;

import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeDetailResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.CreateChallengeRequest;
import com.developersconnect.user.dto.CodingChallengeDtos.UpdateChallengeRequest;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingChallengeService;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/coding-challenges")
public class AdminCodingChallengeController {

    private final CodingChallengeService challengeService;

    public AdminCodingChallengeController(CodingChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping
    public List<ChallengeDetailResponse> list(
        Authentication authentication,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String company,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String q
    ) {
        requireAdmin(authentication);
        return challengeService.list(
            null, language, category, difficulty, company, tag, q, true
        ).stream()
            .map(summary -> challengeService.getById(UUID.fromString(summary.id()), null, true))
            .toList();
    }

    @GetMapping("/{id}")
    public ChallengeDetailResponse getById(Authentication authentication, @PathVariable UUID id) {
        requireAdmin(authentication);
        return challengeService.getById(id, null, true);
    }

    @PostMapping
    public ResponseEntity<ChallengeDetailResponse> create(
        Authentication authentication,
        @RequestBody CreateChallengeRequest request
    ) {
        AuthPrincipal principal = requireAdmin(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            challengeService.create(request, principal.accountId(), CodingChallenge.CREATOR_ADMIN)
        );
    }

    @PutMapping("/{id}")
    public ChallengeDetailResponse update(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody UpdateChallengeRequest request
    ) {
        requireAdmin(authentication);
        return challengeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        requireAdmin(authentication);
        challengeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private AuthPrincipal requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String roles = principal.roles();
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("ADMIN") && !upper.contains("MODERATOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return principal;
    }
}
