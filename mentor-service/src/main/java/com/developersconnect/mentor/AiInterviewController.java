package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.AiInterviewDtos.StartInterviewRequest;
import com.developersconnect.mentor.dto.AiInterviewDtos.SubmitAnswerRequest;
import com.developersconnect.mentor.security.AuthSupport;
import com.developersconnect.mentor.service.AiInterviewService;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai-interview")
public class AiInterviewController {

    private final AiInterviewService aiInterviewService;

    public AiInterviewController(AiInterviewService aiInterviewService) {
        this.aiInterviewService = aiInterviewService;
    }

    @PostMapping(value = "/upload-resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadResume(
        Authentication auth,
        @RequestPart("file") MultipartFile file
    ) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.uploadResumeWithUrl(userId, file));
    }

    @PostMapping("/start")
    public ResponseEntity<?> start(Authentication auth, @RequestBody StartInterviewRequest body) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.startInterview(userId, body));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(Authentication auth, @PathVariable UUID id) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.getSession(userId, id));
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<?> submitAnswer(
        Authentication auth,
        @PathVariable UUID id,
        @RequestBody SubmitAnswerRequest body
    ) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.submitAnswer(
            userId, id, body.answer(), body.questionId(), body.answerTimeSeconds()
        ));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> end(Authentication auth, @PathVariable UUID id) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.endInterview(userId, id));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<?> result(Authentication auth, @PathVariable UUID id) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiInterviewService.getResult(userId, id));
    }
}
