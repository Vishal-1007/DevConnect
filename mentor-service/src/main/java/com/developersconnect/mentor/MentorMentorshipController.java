package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MentorStudentResponse;
import com.developersconnect.mentor.dto.MentorshipRequestResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorshipRequestService;
import com.developersconnect.mentor.service.MentorStudentService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentor")
public class MentorMentorshipController {

    private final MentorshipRequestService mentorshipRequestService;
    private final MentorStudentService mentorStudentService;

    public MentorMentorshipController(
        MentorshipRequestService mentorshipRequestService,
        MentorStudentService mentorStudentService
    ) {
        this.mentorshipRequestService = mentorshipRequestService;
        this.mentorStudentService = mentorStudentService;
    }

    @GetMapping("/mentorship-requests")
    public ResponseEntity<List<MentorshipRequestResponse>> listPending(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorshipRequestService.listPendingForMentor(principal.accountId()));
    }

    @GetMapping("/mentorship-requests/count")
    public ResponseEntity<Map<String, Long>> countPending(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        long count = mentorshipRequestService.countPendingForMentor(principal.accountId());
        return ResponseEntity.ok(Map.of("pending", count));
    }

    @GetMapping("/my-students")
    public ResponseEntity<List<MentorStudentResponse>> myStudents(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String category
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(mentorStudentService.listActiveStudents(principal.accountId(), category));
    }
}
