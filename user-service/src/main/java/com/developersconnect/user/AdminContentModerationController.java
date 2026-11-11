package com.developersconnect.user;

import com.developersconnect.user.dto.AdminModeratedPostResponse;
import com.developersconnect.user.dto.ContentModerationAnalyticsResponse;
import com.developersconnect.user.service.AdminContentModerationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/content-moderation")
public class AdminContentModerationController {

    private final AdminContentModerationService adminContentModerationService;

    public AdminContentModerationController(AdminContentModerationService adminContentModerationService) {
        this.adminContentModerationService = adminContentModerationService;
    }

    @GetMapping
    public ResponseEntity<List<AdminModeratedPostResponse>> listPosts(
        @RequestParam(defaultValue = "active") String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(adminContentModerationService.listPosts(status, category, q, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ContentModerationAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminContentModerationService.getAnalytics());
    }

    @GetMapping("/{postId}")
    public ResponseEntity<AdminModeratedPostResponse> getPost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.getPost(postId));
    }

    @PostMapping("/{postId}/flag")
    public ResponseEntity<AdminModeratedPostResponse> flagPost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.flagPost(postId));
    }

    @PostMapping("/{postId}/unflag")
    public ResponseEntity<AdminModeratedPostResponse> unflagPost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.unflagPost(postId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<AdminModeratedPostResponse> removePost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.removePost(postId));
    }

    @PostMapping("/{postId}/restore")
    public ResponseEntity<AdminModeratedPostResponse> restorePost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.restorePost(postId));
    }

    @PostMapping("/{postId}/scan")
    public ResponseEntity<AdminModeratedPostResponse> scanPost(@PathVariable UUID postId) {
        return ResponseEntity.ok(adminContentModerationService.scanPost(postId));
    }

    @PostMapping("/scan-all")
    public ResponseEntity<ContentModerationAnalyticsResponse> scanAllPosts() {
        return ResponseEntity.ok(adminContentModerationService.scanAllPosts());
    }
}
