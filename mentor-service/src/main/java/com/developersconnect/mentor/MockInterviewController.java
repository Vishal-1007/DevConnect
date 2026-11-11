package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MockInterviewDtos.BookInterviewBody;
import com.developersconnect.mentor.dto.MockInterviewDtos.CreateRequestBody;
import com.developersconnect.mentor.dto.MockInterviewDtos.SubmitFeedbackBody;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.security.AuthSupport;
import com.developersconnect.mentor.service.MockInterviewService;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
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
@RequestMapping("/api/mock-interviews")
public class MockInterviewController {

    private final MockInterviewService mockInterviewService;

    public MockInterviewController(MockInterviewService mockInterviewService) {
        this.mockInterviewService = mockInterviewService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(mockInterviewService.getStats());
    }

    @GetMapping("/categories")
    public ResponseEntity<?> categories() {
        return ResponseEntity.ok(mockInterviewService.getCategories());
    }

    @GetMapping("/interviewers")
    public ResponseEntity<?> interviewers(
        Authentication auth,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "false") boolean onlineOnly,
        @RequestParam(required = false) Double minRating,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice
    ) {
        return ResponseEntity.ok(mockInterviewService.listInterviewers(
            AuthSupport.optionalUserId(auth), search, category, onlineOnly, minRating, minPrice, maxPrice
        ));
    }

    @GetMapping("/interviewers/{id}")
    public ResponseEntity<?> interviewer(Authentication auth, @PathVariable UUID id) {
        return ResponseEntity.ok(mockInterviewService.getInterviewer(id, AuthSupport.optionalUserId(auth)));
    }

    @GetMapping("/interviewers/{id}/slots")
    public ResponseEntity<?> availableSlots(
        @PathVariable UUID id,
        @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(
            iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE
        ) java.time.LocalDate date,
        @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(
            iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE
        ) java.time.LocalDate fromDate,
        @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(
            iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE
        ) java.time.LocalDate toDate,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(defaultValue = "30") int durationMinutes
    ) {
        if (date != null) {
            return ResponseEntity.ok(mockInterviewService.getAvailableSlotsForDate(id, date, durationMinutes));
        }
        if (fromDate != null || toDate != null) {
            java.time.LocalDate start = fromDate != null ? fromDate : java.time.LocalDate.now();
            java.time.LocalDate end = toDate != null ? toDate : start.plusDays(14);
            return ResponseEntity.ok(mockInterviewService.getAvailableSlotsByLocalDates(
                id, start, end, durationMinutes
            ));
        }
        Instant fromInstant = from != null && !from.isBlank() ? Instant.parse(from) : Instant.now();
        Instant toInstant = to != null && !to.isBlank() ? Instant.parse(to) : fromInstant.plusSeconds(14 * 86400L);
        return ResponseEntity.ok(mockInterviewService.getAvailableSlots(id, fromInstant, toInstant, durationMinutes));
    }

    @GetMapping("/interviewers/{id}/booking-summary")
    public ResponseEntity<?> bookingSummary(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "30") int durationMinutes
    ) {
        return ResponseEntity.ok(mockInterviewService.computeBookingSummary(id, durationMinutes));
    }

    @PostMapping("/book")
    public ResponseEntity<?> book(Authentication auth, @RequestBody BookInterviewBody body) {
        AuthPrincipal principal = AuthSupport.requirePrincipal(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mockInterviewService.bookInterview(principal.accountId(), principal.username(), body)
        );
    }

    @PostMapping("/request")
    public ResponseEntity<?> createRequest(Authentication auth, @RequestBody CreateRequestBody body) {
        AuthPrincipal principal = AuthSupport.requirePrincipal(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mockInterviewService.createRequest(principal.accountId(), principal.username(), body)
        );
    }

    @GetMapping("/my-requests")
    public ResponseEntity<?> myRequests(
        Authentication auth,
        @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(mockInterviewService.listMyRequests(AuthSupport.requireUserId(auth), status));
    }

    @GetMapping("/incoming")
    public ResponseEntity<?> incoming(Authentication auth) {
        return ResponseEntity.ok(mockInterviewService.listIncomingRequests(AuthSupport.requireUserId(auth)));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> accept(Authentication auth, @RequestBody Map<String, UUID> body) {
        return ResponseEntity.ok(mockInterviewService.acceptRequest(AuthSupport.requireUserId(auth), body.get("requestId")));
    }

    @PostMapping("/reject")
    public ResponseEntity<?> reject(Authentication auth, @RequestBody Map<String, UUID> body) {
        return ResponseEntity.ok(mockInterviewService.rejectRequest(AuthSupport.requireUserId(auth), body.get("requestId")));
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(Authentication auth, @RequestBody Map<String, UUID> body) {
        return ResponseEntity.ok(mockInterviewService.cancelRequest(AuthSupport.requireUserId(auth), body.get("requestId")));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> upcoming(Authentication auth) {
        return ResponseEntity.ok(mockInterviewService.getUpcoming(AuthSupport.requireUserId(auth)));
    }

    @GetMapping("/session/{code}")
    public ResponseEntity<?> getSession(Authentication auth, @PathVariable String code) {
        return ResponseEntity.ok(mockInterviewService.getSessionByCode(code, AuthSupport.requireUserId(auth)));
    }

    @PostMapping("/start")
    public ResponseEntity<?> start(Authentication auth, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(mockInterviewService.startSession(AuthSupport.requireUserId(auth), body.get("sessionCode")));
    }

    @PostMapping("/end")
    public ResponseEntity<?> end(Authentication auth, @RequestBody Map<String, UUID> body) {
        return ResponseEntity.ok(mockInterviewService.endSession(AuthSupport.requireUserId(auth), body.get("sessionId")));
    }

    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(Authentication auth, @RequestBody SubmitFeedbackBody body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mockInterviewService.submitFeedback(AuthSupport.requireUserId(auth), body)
        );
    }

    @GetMapping("/feedback/{sessionId}")
    public ResponseEntity<?> getFeedback(Authentication auth, @PathVariable UUID sessionId) {
        return ResponseEntity.ok(mockInterviewService.getFeedback(sessionId, AuthSupport.requireUserId(auth)));
    }

    @PostMapping("/favorites/{interviewerUserId}")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(
        Authentication auth,
        @PathVariable UUID interviewerUserId
    ) {
        boolean favorited = mockInterviewService.toggleFavorite(AuthSupport.requireUserId(auth), interviewerUserId);
        return ResponseEntity.ok(Collections.singletonMap("favorited", favorited));
    }
}
