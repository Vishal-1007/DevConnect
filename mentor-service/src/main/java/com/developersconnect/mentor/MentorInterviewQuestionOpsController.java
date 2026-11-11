package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MentorInterviewQuestionResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorInterviewQuestionService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/me/workspace/questions")
public class MentorInterviewQuestionOpsController {

    private final MentorInterviewQuestionService interviewQuestionService;

    public MentorInterviewQuestionOpsController(MentorInterviewQuestionService interviewQuestionService) {
        this.interviewQuestionService = interviewQuestionService;
    }

    @PostMapping("/{questionId}/duplicate")
    public ResponseEntity<MentorInterviewQuestionResponse> duplicateQuestion(
        Authentication authentication,
        @PathVariable UUID questionId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(interviewQuestionService.copyQuestion(mentorId, questionId));
    }

    @PostMapping("/{questionId}/archive")
    public ResponseEntity<MentorInterviewQuestionResponse> archiveQuestion(
        Authentication authentication,
        @PathVariable UUID questionId,
        @RequestParam(defaultValue = "true") boolean archived
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(interviewQuestionService.setQuestionArchived(mentorId, questionId, archived));
    }

    private UUID principalId(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return principal.accountId();
    }
}
