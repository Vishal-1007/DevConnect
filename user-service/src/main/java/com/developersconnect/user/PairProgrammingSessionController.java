package com.developersconnect.user;

import com.developersconnect.user.dto.PairProgrammingDtos.PairSessionResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.PairProgrammingWorkflowService;
import com.developersconnect.user.service.PairProgrammingWorkflowService.InvitationResponse;
import com.developersconnect.user.service.PairProgrammingWorkflowService.StartMentorSessionRequest;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pair-programming")
public class PairProgrammingSessionController {

    private final PairProgrammingWorkflowService workflowService;

    public PairProgrammingSessionController(PairProgrammingWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/start")
    public ResponseEntity<PairSessionResponse> start(
        Authentication authentication,
        HttpServletRequest httpRequest,
        @RequestBody StartBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        String token = extractBearer(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            workflowService.startMentorSession(
                principal.accountId(),
                principal.username(),
                new StartMentorSessionRequest(
                    body.mentorId(),
                    body.problemId(),
                    body.language(),
                    body.role()
                ),
                token
            )
        );
    }

    @GetMapping("/invitations/incoming")
    public ResponseEntity<List<InvitationResponse>> incoming(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(workflowService.listIncomingInvitations(principal.accountId()));
    }

    @PostMapping("/accept")
    public ResponseEntity<PairSessionResponse> accept(
        Authentication authentication,
        @RequestBody SessionIdBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(workflowService.acceptInvitation(principal.accountId(), body.sessionId()));
    }

    @PostMapping("/reject")
    public ResponseEntity<PairSessionResponse> reject(
        Authentication authentication,
        @RequestBody SessionIdBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(workflowService.rejectInvitation(principal.accountId(), body.sessionId()));
    }

    @GetMapping("/session/{code}")
    public ResponseEntity<PairSessionResponse> getByCode(
        Authentication authentication,
        @PathVariable String code
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(workflowService.getSessionByCode(code, principal.accountId()));
    }

    @PostMapping("/join/{code}")
    public ResponseEntity<PairSessionResponse> join(
        Authentication authentication,
        @PathVariable String code
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            workflowService.joinByCode(code, principal.accountId(), principal.username())
        );
    }

    private String extractBearer(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return "";
    }

    public record StartBody(
        UUID mentorId,
        UUID problemId,
        String language,
        String role
    ) {}

    public record SessionIdBody(UUID sessionId) {}
}
