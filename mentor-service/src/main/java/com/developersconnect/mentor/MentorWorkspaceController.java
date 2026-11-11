package com.developersconnect.mentor;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.mentor.dto.CreateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.dto.CreateMentorMentorshipPlanRequest;
import com.developersconnect.mentor.dto.CreateMentorSharedNoteRequest;
import com.developersconnect.mentor.dto.CreateMentorStudentRoadmapRequest;
import com.developersconnect.mentor.dto.CreateMentorStudentTaskRequest;
import com.developersconnect.mentor.dto.CreateMentorWithdrawalRequest;
import com.developersconnect.mentor.dto.GenerateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.dto.MentorAnalyticsResponse;
import com.developersconnect.mentor.dto.MentorBookingsOverviewResponse;
import com.developersconnect.mentor.dto.MentorDashboardResponse;
import com.developersconnect.mentor.dto.MentorEarningsResponse;
import com.developersconnect.mentor.dto.MentorInterviewQuestionResponse;
import com.developersconnect.mentor.dto.MentorLeaderboardResponse;
import com.developersconnect.mentor.dto.MentorMentorshipPlanResponse;
import com.developersconnect.mentor.dto.MentorMyAvailabilityResponse;
import com.developersconnect.mentor.dto.MentorPendingRequestResponse;
import com.developersconnect.mentor.dto.MentorPerformanceInsightsResponse;
import com.developersconnect.mentor.dto.MentorReviewResponse;
import com.developersconnect.mentor.dto.MentorReviewsSummaryResponse;
import com.developersconnect.mentor.dto.MentorSharedNoteFileResponse;
import com.developersconnect.mentor.dto.MentorSharedNoteResponse;
import com.developersconnect.mentor.dto.MentorStudentDetailResponse;
import com.developersconnect.mentor.dto.MentorStudentResponse;
import com.developersconnect.mentor.dto.MentorStudentRoadmapItemResponse;
import com.developersconnect.mentor.dto.MentorStudentTaskResponse;
import com.developersconnect.mentor.dto.MentorWithdrawalResponse;
import com.developersconnect.mentor.dto.MentorshipBookingResponse;
import com.developersconnect.mentor.dto.ReplyMentorReviewRequest;
import com.developersconnect.mentor.dto.RescheduleMentorBookingRequest;
import com.developersconnect.mentor.dto.SaveMentorAvailabilityRequest;
import com.developersconnect.mentor.dto.ShareMentorSharedNoteRequest;
import com.developersconnect.mentor.dto.UpdateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.dto.UpdateMentorMentorshipPlanRequest;
import com.developersconnect.mentor.dto.UpdateMentorSharedNoteRequest;
import com.developersconnect.mentor.dto.UpdateMentorStudentRequest;
import com.developersconnect.mentor.dto.UpdateMentorStudentRoadmapRequest;
import com.developersconnect.mentor.dto.UpdateMentorStudentTaskRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorInsightsService;
import com.developersconnect.mentor.service.MentorInterviewQuestionSeedService;
import com.developersconnect.mentor.service.MentorInterviewQuestionService;
import com.developersconnect.mentor.service.MentorLeaderboardService;
import com.developersconnect.mentor.service.MentorPlansReviewsSampleDataService;
import com.developersconnect.mentor.service.MentorPlansReviewsService;
import com.developersconnect.mentor.service.MentorRecurringSampleDataService;
import com.developersconnect.mentor.service.MentorSharedNotesSampleDataService;
import com.developersconnect.mentor.service.MentorSharedNotesService;
import com.developersconnect.mentor.service.MentorStudentSampleDataService;
import com.developersconnect.mentor.service.MentorStudentService;
import com.developersconnect.mentor.service.MentorWorkspaceSampleDataService;
import com.developersconnect.mentor.service.MentorWorkspaceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mentors/me/workspace")
public class MentorWorkspaceController {

    private final MentorWorkspaceService workspaceService;
    private final MentorStudentService studentService;
    private final MentorPlansReviewsService plansReviewsService;
    private final MentorInsightsService insightsService;
    private final MentorLeaderboardService leaderboardService;
    private final MentorSharedNotesService sharedNotesService;
    private final MentorInterviewQuestionService interviewQuestionService;
    private final MentorInterviewQuestionSeedService interviewQuestionSeedService;
    private final ObjectProvider<MentorWorkspaceSampleDataService> sampleDataService;
    private final ObjectProvider<MentorStudentSampleDataService> studentSampleDataService;
    private final ObjectProvider<MentorRecurringSampleDataService> recurringSampleDataService;
    private final ObjectProvider<MentorPlansReviewsSampleDataService> plansReviewsSampleDataService;
    private final ObjectProvider<MentorSharedNotesSampleDataService> sharedNotesSampleDataService;

    public MentorWorkspaceController(
        MentorWorkspaceService workspaceService,
        MentorStudentService studentService,
        MentorPlansReviewsService plansReviewsService,
        MentorInsightsService insightsService,
        MentorLeaderboardService leaderboardService,
        MentorSharedNotesService sharedNotesService,
        MentorInterviewQuestionService interviewQuestionService,
        MentorInterviewQuestionSeedService interviewQuestionSeedService,
        ObjectProvider<MentorWorkspaceSampleDataService> sampleDataService,
        ObjectProvider<MentorStudentSampleDataService> studentSampleDataService,
        ObjectProvider<MentorRecurringSampleDataService> recurringSampleDataService,
        ObjectProvider<MentorPlansReviewsSampleDataService> plansReviewsSampleDataService,
        ObjectProvider<MentorSharedNotesSampleDataService> sharedNotesSampleDataService
    ) {
        this.workspaceService = workspaceService;
        this.studentService = studentService;
        this.plansReviewsService = plansReviewsService;
        this.insightsService = insightsService;
        this.leaderboardService = leaderboardService;
        this.sharedNotesService = sharedNotesService;
        this.interviewQuestionService = interviewQuestionService;
        this.interviewQuestionSeedService = interviewQuestionSeedService;
        this.sampleDataService = sampleDataService;
        this.studentSampleDataService = studentSampleDataService;
        this.recurringSampleDataService = recurringSampleDataService;
        this.plansReviewsSampleDataService = plansReviewsSampleDataService;
        this.sharedNotesSampleDataService = sharedNotesSampleDataService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<MentorDashboardResponse> dashboard(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.getDashboard(mentorId));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<MentorPendingRequestResponse>> sessionRequests(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.listSessionRequests(mentorId));
    }

    @PostMapping("/bookings/{bookingId}/reschedule")
    public ResponseEntity<MentorshipBookingResponse> reschedule(
        Authentication authentication,
        @PathVariable UUID bookingId,
        @Valid @RequestBody RescheduleMentorBookingRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.rescheduleBooking(mentorId, bookingId, request));
    }

    @GetMapping("/students")
    public ResponseEntity<List<MentorStudentResponse>> students(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String category
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.listActiveStudents(mentorId, category));
    }

    @GetMapping("/students/{learnerId}")
    public ResponseEntity<MentorStudentDetailResponse> studentDetail(
        Authentication authentication,
        @PathVariable UUID learnerId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.getStudentDetail(mentorId, learnerId));
    }

    @PutMapping("/students/{learnerId}")
    public ResponseEntity<MentorStudentDetailResponse> updateStudent(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @Valid @RequestBody UpdateMentorStudentRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.updateStudent(mentorId, learnerId, request));
    }

    @PostMapping("/students/{learnerId}/tasks")
    public ResponseEntity<MentorStudentTaskResponse> createTask(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @Valid @RequestBody CreateMentorStudentTaskRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.createTask(mentorId, learnerId, request));
    }

    @PutMapping("/students/{learnerId}/tasks/{taskId}")
    public ResponseEntity<MentorStudentTaskResponse> updateTask(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @PathVariable UUID taskId,
        @Valid @RequestBody UpdateMentorStudentTaskRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.updateTask(mentorId, learnerId, taskId, request));
    }

    @DeleteMapping("/students/{learnerId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @PathVariable UUID taskId
    ) {
        UUID mentorId = principalId(authentication);
        studentService.deleteTask(mentorId, learnerId, taskId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/students/{learnerId}/roadmap")
    public ResponseEntity<MentorStudentRoadmapItemResponse> createRoadmapItem(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @Valid @RequestBody CreateMentorStudentRoadmapRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.createRoadmapItem(mentorId, learnerId, request));
    }

    @PutMapping("/students/{learnerId}/roadmap/{itemId}")
    public ResponseEntity<MentorStudentRoadmapItemResponse> updateRoadmapItem(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @PathVariable UUID itemId,
        @Valid @RequestBody UpdateMentorStudentRoadmapRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(studentService.updateRoadmapItem(mentorId, learnerId, itemId, request));
    }

    @DeleteMapping("/students/{learnerId}/roadmap/{itemId}")
    public ResponseEntity<Void> deleteRoadmapItem(
        Authentication authentication,
        @PathVariable UUID learnerId,
        @PathVariable UUID itemId
    ) {
        UUID mentorId = principalId(authentication);
        studentService.deleteRoadmapItem(mentorId, learnerId, itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings/overview")
    public ResponseEntity<MentorBookingsOverviewResponse> bookingsOverview(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.getBookingsOverview(mentorId));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<MentorshipBookingResponse>> bookings(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(defaultValue = "100") int limit
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.listBookings(mentorId, status, limit));
    }

    @PostMapping("/bookings/{bookingId}/confirm")
    public ResponseEntity<MentorshipBookingResponse> confirm(
        Authentication authentication,
        @PathVariable UUID bookingId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.confirmBooking(mentorId, bookingId));
    }

    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<MentorshipBookingResponse> complete(
        Authentication authentication,
        @PathVariable UUID bookingId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.completeBooking(mentorId, bookingId));
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<MentorshipBookingResponse> cancel(
        Authentication authentication,
        @PathVariable UUID bookingId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.cancelBooking(mentorId, bookingId));
    }

    @GetMapping("/availability")
    public ResponseEntity<MentorMyAvailabilityResponse> availability(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.getAvailability(mentorId));
    }

    @PutMapping("/availability")
    public ResponseEntity<MentorMyAvailabilityResponse> saveAvailability(
        Authentication authentication,
        @Valid @RequestBody SaveMentorAvailabilityRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.saveAvailability(mentorId, request));
    }

    @GetMapping("/earnings")
    public ResponseEntity<MentorEarningsResponse> earnings(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.getEarnings(mentorId));
    }

    @PostMapping("/earnings/withdrawals")
    public ResponseEntity<MentorWithdrawalResponse> requestWithdrawal(
        Authentication authentication,
        @Valid @RequestBody CreateMentorWithdrawalRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(workspaceService.requestWithdrawal(mentorId, request));
    }

    @GetMapping("/analytics")
    public ResponseEntity<MentorAnalyticsResponse> analytics(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(workspaceService.getAnalytics(mentorId));
    }

    @GetMapping("/insights")
    public ResponseEntity<MentorPerformanceInsightsResponse> insights(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(insightsService.getInsights(mentorId));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<MentorLeaderboardResponse> leaderboard(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String period,
        @RequestParam(defaultValue = "50") int limit
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(leaderboardService.getLeaderboard(mentorId, period, limit));
    }

    @GetMapping("/plans")
    public ResponseEntity<List<MentorMentorshipPlanResponse>> plans(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.listPlans(mentorId));
    }

    @PostMapping("/plans")
    public ResponseEntity<MentorMentorshipPlanResponse> createPlan(
        Authentication authentication,
        @Valid @RequestBody CreateMentorMentorshipPlanRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.createPlan(mentorId, request));
    }

    @PutMapping("/plans/{planId}")
    public ResponseEntity<MentorMentorshipPlanResponse> updatePlan(
        Authentication authentication,
        @PathVariable UUID planId,
        @Valid @RequestBody UpdateMentorMentorshipPlanRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.updatePlan(mentorId, planId, request));
    }

    @DeleteMapping("/plans/{planId}")
    public ResponseEntity<Void> deletePlan(
        Authentication authentication,
        @PathVariable UUID planId
    ) {
        UUID mentorId = principalId(authentication);
        plansReviewsService.deletePlan(mentorId, planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reviews")
    public ResponseEntity<MentorReviewsSummaryResponse> reviews(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.getReviewsSummary(mentorId));
    }

    @PostMapping("/reviews/{reviewId}/reply")
    public ResponseEntity<MentorReviewResponse> replyToReview(
        Authentication authentication,
        @PathVariable UUID reviewId,
        @Valid @RequestBody ReplyMentorReviewRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.replyToReview(mentorId, reviewId, request));
    }

    @PutMapping("/reviews/{reviewId}/showcase")
    public ResponseEntity<MentorReviewResponse> toggleShowcase(
        Authentication authentication,
        @PathVariable UUID reviewId,
        @RequestParam(defaultValue = "true") boolean showcased
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(plansReviewsService.toggleShowcase(mentorId, reviewId, showcased));
    }

    @GetMapping("/notes")
    public ResponseEntity<List<MentorSharedNoteResponse>> sharedNotes(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String type,
        @RequestParam(defaultValue = "") String search
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(sharedNotesService.listNotes(mentorId, type, search));
    }

    @GetMapping("/notes/{noteId}")
    public ResponseEntity<MentorSharedNoteResponse> sharedNote(
        Authentication authentication,
        @PathVariable UUID noteId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(sharedNotesService.getNote(mentorId, noteId));
    }

    @GetMapping("/notes/{noteId}/file")
    public ResponseEntity<MentorSharedNoteFileResponse> sharedNoteFile(
        Authentication authentication,
        @PathVariable UUID noteId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(sharedNotesService.getNoteFile(mentorId, noteId));
    }

    @PostMapping("/notes")
    public ResponseEntity<MentorSharedNoteResponse> createSharedNote(
        Authentication authentication,
        @Valid @RequestBody CreateMentorSharedNoteRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(sharedNotesService.createNote(mentorId, request));
    }

    @PutMapping("/notes/{noteId}")
    public ResponseEntity<MentorSharedNoteResponse> updateSharedNote(
        Authentication authentication,
        @PathVariable UUID noteId,
        @Valid @RequestBody UpdateMentorSharedNoteRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(sharedNotesService.updateNote(mentorId, noteId, request));
    }

    @PostMapping("/notes/{noteId}/share")
    public ResponseEntity<MentorSharedNoteResponse> shareSharedNote(
        Authentication authentication,
        @PathVariable UUID noteId,
        @Valid @RequestBody ShareMentorSharedNoteRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(sharedNotesService.shareNote(mentorId, noteId, request));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<Void> deleteSharedNote(
        Authentication authentication,
        @PathVariable UUID noteId
    ) {
        UUID mentorId = principalId(authentication);
        sharedNotesService.deleteNote(mentorId, noteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/questions")
    public ResponseEntity<List<MentorInterviewQuestionResponse>> interviewQuestions(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String category,
        @RequestParam(defaultValue = "all") String difficulty,
        @RequestParam(defaultValue = "") String search,
        @RequestParam(defaultValue = "all") String view
    ) {
        interviewQuestionSeedService.ensurePlatformLibrary();
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(
            interviewQuestionService.listQuestions(mentorId, category, difficulty, search, view)
        );
    }

    @PostMapping("/questions")
    public ResponseEntity<MentorInterviewQuestionResponse> createInterviewQuestion(
        Authentication authentication,
        @Valid @RequestBody CreateMentorInterviewQuestionRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(interviewQuestionService.createQuestion(mentorId, request));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<MentorInterviewQuestionResponse> updateInterviewQuestion(
        Authentication authentication,
        @PathVariable UUID questionId,
        @Valid @RequestBody UpdateMentorInterviewQuestionRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(interviewQuestionService.updateQuestion(mentorId, questionId, request));
    }

    @PostMapping("/questions/{questionId}/save")
    public ResponseEntity<MentorInterviewQuestionResponse> toggleInterviewQuestionSave(
        Authentication authentication,
        @PathVariable UUID questionId
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(interviewQuestionService.toggleSave(mentorId, questionId));
    }

    @PostMapping("/questions/generate")
    public ResponseEntity<MentorInterviewQuestionResponse> generateInterviewQuestion(
        Authentication authentication,
        @Valid @RequestBody GenerateMentorInterviewQuestionRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(interviewQuestionService.generateQuestion(mentorId, request));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteInterviewQuestion(
        Authentication authentication,
        @PathVariable UUID questionId
    ) {
        UUID mentorId = principalId(authentication);
        interviewQuestionService.deleteQuestion(mentorId, questionId);
        return ResponseEntity.noContent().build();
    }

    private UUID principalId(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return principal.accountId();
    }
}
