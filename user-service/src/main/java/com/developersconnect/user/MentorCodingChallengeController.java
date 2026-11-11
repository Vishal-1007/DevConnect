package com.developersconnect.user;

import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeDetailResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.CreateChallengeRequest;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingChallengeService;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/mentors/coding-challenges")
public class MentorCodingChallengeController {

    private final CodingChallengeService challengeService;

    public MentorCodingChallengeController(CodingChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping("/mine")
    public List<ChallengeDetailResponse> mine(Authentication authentication) {
        AuthPrincipal principal = requireMentor(authentication);
        return challengeService.listByCreator(principal.accountId());
    }

    @PostMapping
    public ResponseEntity<ChallengeDetailResponse> create(
        Authentication authentication,
        @RequestBody CreateChallengeRequest request
    ) {
        AuthPrincipal principal = requireMentor(authentication);
        CreateChallengeRequest mentorRequest = new CreateChallengeRequest(
            request.title(),
            request.description(),
            request.difficulty(),
            request.category(),
            request.languages(),
            request.tags(),
            request.companies(),
            request.starterCode(),
            request.testCases(),
            request.solution(),
            request.published() != null ? request.published() : true
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(
            challengeService.create(mentorRequest, principal.accountId(), CodingChallenge.CREATOR_MENTOR)
        );
    }

    private AuthPrincipal requireMentor(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String roles = principal.roles();
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("MENTOR") && !upper.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        return principal;
    }
}
