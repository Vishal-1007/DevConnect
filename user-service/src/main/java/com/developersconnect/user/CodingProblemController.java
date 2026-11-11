package com.developersconnect.user;

import com.developersconnect.user.dto.CodingProblemDtos.AttemptResponse;
import com.developersconnect.user.dto.CodingProblemDtos.CreateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemDetailResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemStatsResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemSummaryResponse;
import com.developersconnect.user.dto.CodingProblemDtos.SubmitAttemptRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingProblemService;
import java.util.List;
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
@RequestMapping("/api/problems")
public class CodingProblemController {

    private final CodingProblemService problemService;

    public CodingProblemController(CodingProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping("/stats")
    public ProblemStatsResponse stats(Authentication authentication) {
        return problemService.stats(userId(authentication));
    }

    @GetMapping("/filters/companies")
    public List<String> companies() {
        return problemService.listCompanies();
    }

    @GetMapping("/filters/tags")
    public List<String> tags() {
        return problemService.listTags();
    }

    @GetMapping
    public List<ProblemSummaryResponse> list(
        Authentication authentication,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String company,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String q
    ) {
        return problemService.listPublished(userId(authentication), language, category, difficulty, company, tag, q);
    }

    @GetMapping("/{id}")
    public ProblemDetailResponse getById(Authentication authentication, @PathVariable UUID id) {
        return problemService.getById(id, userId(authentication), false, false);
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<AttemptResponse> submitAttempt(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody SubmitAttemptRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            problemService.recordAttempt(principal.accountId(), id, request)
        );
    }

    private UUID userId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return null;
        }
        return principal.accountId();
    }
}
