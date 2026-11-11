package com.developersconnect.user;

import com.developersconnect.user.dto.CreateDiscussionReplyRequest;
import com.developersconnect.user.dto.CreateDiscussionThreadRequest;
import com.developersconnect.user.dto.DiscussionReplyResponse;
import com.developersconnect.user.dto.DiscussionThreadResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.DiscussionService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/users/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping
    public ResponseEntity<List<DiscussionThreadResponse>> listThreads(
        @RequestParam(required = false) String topic,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(discussionService.listThreads(topic, q, limit));
    }

    @PostMapping
    public ResponseEntity<DiscussionThreadResponse> createThread(
        Authentication authentication,
        @Valid @RequestBody CreateDiscussionThreadRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(discussionService.createThread(principal.accountId(), principal.username(), request));
    }

    @GetMapping("/{threadId}")
    public ResponseEntity<DiscussionThreadResponse> getThread(@PathVariable UUID threadId) {
        return ResponseEntity.ok(discussionService.getThread(threadId));
    }

    @GetMapping("/{threadId}/replies")
    public ResponseEntity<List<DiscussionReplyResponse>> listReplies(@PathVariable UUID threadId) {
        return ResponseEntity.ok(discussionService.listReplies(threadId));
    }

    @PostMapping("/{threadId}/replies")
    public ResponseEntity<DiscussionReplyResponse> addReply(
        Authentication authentication,
        @PathVariable UUID threadId,
        @Valid @RequestBody CreateDiscussionReplyRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(discussionService.addReply(threadId, principal.accountId(), request));
    }

    @PostMapping("/{threadId}/solved/{replyId}")
    public ResponseEntity<DiscussionThreadResponse> markSolved(
        Authentication authentication,
        @PathVariable UUID threadId,
        @PathVariable UUID replyId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(discussionService.markSolved(threadId, principal.accountId(), replyId));
    }
}
