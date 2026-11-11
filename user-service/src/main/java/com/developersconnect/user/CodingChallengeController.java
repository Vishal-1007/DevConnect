package com.developersconnect.user;

import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeDetailResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeStatsResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeSummaryResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingChallengeService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coding-challenges")
public class CodingChallengeController {

    private final CodingChallengeService challengeService;

    public CodingChallengeController(CodingChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @GetMapping("/stats")
    public ChallengeStatsResponse stats(Authentication authentication) {
        UUID userId = userId(authentication);
        return challengeService.stats(userId);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return CodingChallengeService.CATEGORIES;
    }

    @GetMapping("/filters/companies")
    public List<String> companies() {
        return challengeService.listCompanies();
    }

    @GetMapping("/filters/tags")
    public List<String> tags() {
        return challengeService.listTags();
    }

    @GetMapping
    public List<ChallengeSummaryResponse> list(
        Authentication authentication,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String company,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String q
    ) {
        return challengeService.list(
            userId(authentication), language, category, difficulty, company, tag, q, false
        );
    }

    @GetMapping("/{id}")
    public ChallengeDetailResponse getById(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        return challengeService.getById(id, userId(authentication), false);
    }

    private UUID userId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return null;
        }
        return principal.accountId();
    }
}
