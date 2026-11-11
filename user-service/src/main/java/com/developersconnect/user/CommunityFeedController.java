package com.developersconnect.user;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.user.dto.CommunityCommentResponse;
import com.developersconnect.user.dto.CommunityFeedStatsResponse;
import com.developersconnect.user.dto.CommunityPostResponse;
import com.developersconnect.user.dto.CreateCommunityCommentRequest;
import com.developersconnect.user.dto.CreateCommunityPostRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CommunityFeedService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/posts")
public class CommunityFeedController {

    private final CommunityFeedService communityFeedService;

    public CommunityFeedController(CommunityFeedService communityFeedService) {
        this.communityFeedService = communityFeedService;
    }

    @GetMapping("/stats")
    public ResponseEntity<CommunityFeedStatsResponse> getStats() {
        return ResponseEntity.ok(communityFeedService.getStats());
    }

    @GetMapping
    public ResponseEntity<List<CommunityPostResponse>> listFeed(
        Authentication authentication,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String tag,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            communityFeedService.listFeed(principal.accountId(), category, q, tag, sort, limit)
        );
    }

    @PostMapping
    public ResponseEntity<CommunityPostResponse> createPost(
        Authentication authentication,
        @Valid @RequestBody CreateCommunityPostRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(communityFeedService.createPost(principal.accountId(), principal.username(), request));
    }

    @PostMapping("/{postId}/likes")
    public ResponseEntity<CommunityPostResponse> likePost(
        Authentication authentication,
        @PathVariable UUID postId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityFeedService.likePost(postId, principal.accountId()));
    }

    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<CommunityPostResponse> unlikePost(
        Authentication authentication,
        @PathVariable UUID postId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityFeedService.unlikePost(postId, principal.accountId()));
    }

    @PostMapping("/{postId}/save")
    public ResponseEntity<CommunityPostResponse> savePost(
        Authentication authentication,
        @PathVariable UUID postId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityFeedService.savePost(postId, principal.accountId()));
    }

    @DeleteMapping("/{postId}/save")
    public ResponseEntity<CommunityPostResponse> unsavePost(
        Authentication authentication,
        @PathVariable UUID postId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(communityFeedService.unsavePost(postId, principal.accountId()));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommunityCommentResponse>> listComments(@PathVariable UUID postId) {
        return ResponseEntity.ok(communityFeedService.listComments(postId));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommunityCommentResponse> addComment(
        Authentication authentication,
        @PathVariable UUID postId,
        @Valid @RequestBody CreateCommunityCommentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(communityFeedService.addComment(postId, principal.accountId(), request));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
        Authentication authentication,
        @PathVariable UUID postId,
        @PathVariable UUID commentId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        communityFeedService.deleteComment(postId, commentId, principal.accountId());
        return ResponseEntity.noContent().build();
    }
}
