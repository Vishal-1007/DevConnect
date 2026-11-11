package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MentorApplicationDraftResponse;
import com.developersconnect.mentor.dto.MentorApplicationResponse;
import com.developersconnect.mentor.dto.MentorApplicationUploadResponse;
import com.developersconnect.mentor.dto.SaveMentorApplicationDraftRequest;
import com.developersconnect.mentor.dto.SubmitMentorApplicationRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/mentors/application")
public class MentorApplicationController {

    private final MentorApplicationService applicationService;

    public MentorApplicationController(MentorApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping("/draft")
    public ResponseEntity<MentorApplicationDraftResponse> getDraft(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(applicationService.getDraft(principal.accountId()));
    }

    @PutMapping("/draft")
    public ResponseEntity<MentorApplicationDraftResponse> saveDraft(
        Authentication authentication,
        @Valid @RequestBody SaveMentorApplicationDraftRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            applicationService.saveDraft(principal.accountId(), principal.username(), request)
        );
    }

    @PostMapping("/submit")
    public ResponseEntity<MentorApplicationResponse> submit(
        Authentication authentication,
        @Valid @RequestBody SubmitMentorApplicationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        MentorApplicationResponse response = applicationService.submit(
            principal.accountId(),
            principal.username(),
            request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MentorApplicationUploadResponse> upload(
        Authentication authentication,
        @RequestParam("type") String type,
        @RequestPart("file") MultipartFile file
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(applicationService.uploadDocument(principal.accountId(), type, file));
    }
}
