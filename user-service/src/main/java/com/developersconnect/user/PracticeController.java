package com.developersconnect.user;

import com.developersconnect.user.dto.PracticeDtos.PracticeAttemptResponse;
import com.developersconnect.user.dto.PracticeDtos.RunPracticeCodeRequest;
import com.developersconnect.user.dto.PracticeDtos.SavePracticeCodeRequest;
import com.developersconnect.user.dto.PracticeDtos.StartPracticeRequest;
import com.developersconnect.user.dto.PracticeDtos.SubmitPracticeRequest;
import com.developersconnect.user.dto.PracticeDtos.SubmitPracticeResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.PracticeService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @PostMapping("/start")
    public ResponseEntity<PracticeAttemptResponse> start(
        Authentication authentication,
        @Valid @RequestBody StartPracticeRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            practiceService.start(principal.accountId(), request)
        );
    }

    @GetMapping("/{id}")
    public PracticeAttemptResponse get(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return practiceService.getAttempt(id, principal.accountId());
    }

    @PostMapping("/{id}/code")
    public PracticeAttemptResponse saveCode(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody SavePracticeCodeRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return practiceService.saveCode(id, principal.accountId(), request);
    }

    @PostMapping("/run-code")
    public RunPairCodeResponse runCode(
        Authentication authentication,
        @RequestBody RunPracticeCodeRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return practiceService.runCode(principal.accountId(), request);
    }

    @PostMapping("/{id}/submit")
    public SubmitPracticeResponse submit(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody SubmitPracticeRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return practiceService.submit(id, principal.accountId(), request);
    }
}
