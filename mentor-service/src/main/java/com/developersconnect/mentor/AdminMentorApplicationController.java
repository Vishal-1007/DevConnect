package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.AdminMentorApplicationDetailResponse;
import com.developersconnect.mentor.dto.AdminRejectApplicationRequest;
import com.developersconnect.mentor.dto.AdminRequestInfoRequest;
import com.developersconnect.mentor.dto.AdminReviewNoteRequest;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.ReviewApplicationRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.AdminMentorApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/mentor-applications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMentorApplicationController {

    private final AdminMentorApplicationService adminService;

    public AdminMentorApplicationController(AdminMentorApplicationService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public ResponseEntity<List<AdminMentorApplicationDetailResponse>> list() {
        return ResponseEntity.ok(adminService.listForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminMentorApplicationDetailResponse> get(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(adminService.getForAdmin(id, principal.username()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<MentorApplicationResponse> approve(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestBody(required = false) ReviewApplicationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(adminService.approve(id, principal.username(), request));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<MentorApplicationResponse> reject(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody AdminRejectApplicationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(adminService.reject(id, principal.username(), request));
    }

    @PostMapping("/{id}/request-info")
    public ResponseEntity<AdminMentorApplicationDetailResponse> requestInfo(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody AdminRequestInfoRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(adminService.requestInfo(id, principal.username(), request));
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<AdminMentorApplicationDetailResponse> suspend(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(adminService.suspend(id, principal.username()));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<AdminMentorApplicationDetailResponse> saveNotes(
        @PathVariable UUID id,
        @Valid @RequestBody AdminReviewNoteRequest request
    ) {
        return ResponseEntity.ok(adminService.saveNotes(id, request.notes()));
    }
}
