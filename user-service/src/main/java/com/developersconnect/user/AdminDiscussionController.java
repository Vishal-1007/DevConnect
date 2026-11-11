package com.developersconnect.user;

import com.developersconnect.user.dto.AdminDiscussionThreadResponse;
import com.developersconnect.user.dto.DiscussionAnalyticsResponse;
import com.developersconnect.user.dto.UpdateAdminDiscussionRequest;
import com.developersconnect.user.service.AdminDiscussionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/discussions")
public class AdminDiscussionController {

    private final AdminDiscussionService adminDiscussionService;

    public AdminDiscussionController(AdminDiscussionService adminDiscussionService) {
        this.adminDiscussionService = adminDiscussionService;
    }

    @GetMapping
    public ResponseEntity<List<AdminDiscussionThreadResponse>> listThreads(
        @RequestParam(defaultValue = "active") String status,
        @RequestParam(required = false) String topic,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminDiscussionService.listThreads(status, topic, q, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<DiscussionAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminDiscussionService.getAnalytics());
    }

    @GetMapping("/{threadId}")
    public ResponseEntity<AdminDiscussionThreadResponse> getThread(@PathVariable UUID threadId) {
        return ResponseEntity.ok(adminDiscussionService.getThread(threadId));
    }

    @PutMapping("/{threadId}")
    public ResponseEntity<AdminDiscussionThreadResponse> updateThread(
        @PathVariable UUID threadId,
        @Valid @RequestBody UpdateAdminDiscussionRequest request
    ) {
        return ResponseEntity.ok(adminDiscussionService.updateThread(threadId, request));
    }

    @PostMapping("/{threadId}/pin")
    public ResponseEntity<AdminDiscussionThreadResponse> togglePin(@PathVariable UUID threadId) {
        return ResponseEntity.ok(adminDiscussionService.togglePin(threadId));
    }

    @DeleteMapping("/{threadId}")
    public ResponseEntity<AdminDiscussionThreadResponse> removeThread(@PathVariable UUID threadId) {
        return ResponseEntity.ok(adminDiscussionService.removeThread(threadId));
    }

    @PostMapping("/{threadId}/restore")
    public ResponseEntity<AdminDiscussionThreadResponse> restoreThread(@PathVariable UUID threadId) {
        return ResponseEntity.ok(adminDiscussionService.restoreThread(threadId));
    }
}
