package com.developersconnect.user;

import com.developersconnect.user.dto.CreateSessionReportRequest;
import com.developersconnect.user.dto.PlatformSessionResponse;
import com.developersconnect.user.dto.UpdatePlatformSessionRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminSessionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/sessions")
public class AdminSessionController {

    private final AdminSessionService adminSessionService;

    public AdminSessionController(AdminSessionService adminSessionService) {
        this.adminSessionService = adminSessionService;
    }

    @GetMapping
    public ResponseEntity<List<PlatformSessionResponse>> listSessions(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(required = false) String sessionType,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminSessionService.listSessions(status, sessionType, q, limit));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<PlatformSessionResponse> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(adminSessionService.getSession(sessionId));
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<PlatformSessionResponse> updateSession(
        Authentication authentication,
        @PathVariable UUID sessionId,
        @RequestBody UpdatePlatformSessionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminSessionService.updateSession(sessionId, principal.roles(), request)
        );
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<PlatformSessionResponse> endSession(
        Authentication authentication,
        @PathVariable UUID sessionId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminSessionService.endSession(sessionId, principal.accountId(), principal.roles())
        );
    }

    @PostMapping("/{sessionId}/reports")
    public ResponseEntity<PlatformSessionResponse> addReport(
        Authentication authentication,
        @PathVariable UUID sessionId,
        @Valid @RequestBody CreateSessionReportRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminSessionService.addReport(sessionId, principal.accountId(), request)
        );
    }

    @PostMapping("/{sessionId}/ai-moderation")
    public ResponseEntity<PlatformSessionResponse> runAiModeration(
        Authentication authentication,
        @PathVariable UUID sessionId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminSessionService.runAiModeration(sessionId, principal.roles())
        );
    }
}
