package com.developersconnect.user;

import com.developersconnect.user.dto.CodingProblemDtos.CreateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemDetailResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemStatsResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemSummaryResponse;
import com.developersconnect.user.dto.CodingProblemDtos.SubmitAttemptRequest;
import com.developersconnect.user.dto.CodingProblemDtos.UpdateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.UpdateStatusRequest;
import com.developersconnect.user.dto.CodingProblemDtos.AttemptResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CodingProblemService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/problems")
public class AdminCodingProblemController {

    private final CodingProblemService problemService;

    public AdminCodingProblemController(CodingProblemService problemService) {
        this.problemService = problemService;
    }

    @GetMapping
    public List<ProblemDetailResponse> list(
        Authentication authentication,
        @RequestParam(required = false) String language,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String company,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String q
    ) {
        problemService.requireAdmin(authentication);
        return problemService.listAdmin(language, category, difficulty, company, tag, status, q);
    }

    @GetMapping("/{id}")
    public ProblemDetailResponse getById(Authentication authentication, @PathVariable UUID id) {
        problemService.requireAdmin(authentication);
        return problemService.getById(id, null, true, true);
    }

    @PostMapping
    public ResponseEntity<ProblemDetailResponse> create(
        Authentication authentication,
        @RequestBody CreateProblemRequest request
    ) {
        AuthPrincipal principal = problemService.requireAdmin(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            problemService.create(request, principal.accountId(), true)
        );
    }

    @PutMapping("/{id}")
    public ProblemDetailResponse update(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody UpdateProblemRequest request
    ) {
        problemService.requireAdmin(authentication);
        return problemService.update(id, request, true);
    }

    @PatchMapping("/{id}/status")
    public ProblemDetailResponse updateStatus(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody UpdateStatusRequest request
    ) {
        problemService.requireAdmin(authentication);
        return problemService.updateStatus(id, request.status(), true);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        problemService.requireAdmin(authentication);
        problemService.delete(id, true);
        return ResponseEntity.noContent().build();
    }
}
