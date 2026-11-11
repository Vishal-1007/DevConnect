package com.developersconnect.user;

import com.developersconnect.user.dto.CodingProblemDtos.CreateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemDetailResponse;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingProblemService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/problems")
public class MentorCodingProblemController {

    private final CodingProblemService problemService;

    public MentorCodingProblemController(CodingProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping("/mine")
    public List<ProblemDetailResponse> mine(Authentication authentication) {
        AuthPrincipal principal = problemService.requireMentor(authentication);
        return problemService.listByCreator(principal.accountId());
    }

    @PostMapping
    public ResponseEntity<ProblemDetailResponse> create(
        Authentication authentication,
        @RequestBody CreateProblemRequest request
    ) {
        AuthPrincipal principal = problemService.requireMentor(authentication);
        CreateProblemRequest mentorRequest = new CreateProblemRequest(
            request.title(), request.description(), request.category(), request.difficulty(),
            request.languages(), request.tags(), request.companies(), request.starterCode(),
            request.testCases(), request.solution(), request.hints(), request.constraints(),
            request.examples(), CodingChallenge.STATUS_PENDING_APPROVAL
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(
            problemService.create(mentorRequest, principal.accountId(), false)
        );
    }
}
