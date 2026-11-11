package com.developersconnect.user;

import com.developersconnect.user.dto.CommunityPostResponse;
import com.developersconnect.user.dto.CommunityPostUploadResponse;
import com.developersconnect.user.dto.VotePollRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.CommunityFeedService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/posts")
public class CommunityPostMediaController {

    private final CommunityFeedService communityFeedService;

    public CommunityPostMediaController(CommunityFeedService communityFeedService) {
        this.communityFeedService = communityFeedService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommunityPostUploadResponse> uploadPostFile(
        Authentication authentication,
        @RequestParam("file") MultipartFile file,
        @RequestParam("kind") String kind
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(communityFeedService.uploadFile(principal.accountId(), file, kind));
    }

    @PostMapping("/{postId}/poll/vote")
    public ResponseEntity<CommunityPostResponse> castPollVote(
        Authentication authentication,
        @PathVariable UUID postId,
        @Valid @RequestBody VotePollRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            communityFeedService.votePoll(postId, principal.accountId(), request.optionId())
        );
    }
}
