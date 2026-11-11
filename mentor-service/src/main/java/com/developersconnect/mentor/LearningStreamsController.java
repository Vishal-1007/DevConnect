package com.developersconnect.mentor;

import java.util.List;
import java.util.UUID;

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

import com.developersconnect.mentor.dto.ConfirmCoursePurchaseRequest;
import com.developersconnect.mentor.dto.CourseProgressResponse;
import com.developersconnect.mentor.dto.LessonProgressResponse;
import com.developersconnect.mentor.dto.ResumePlaybackResponse;
import com.developersconnect.mentor.dto.SaveLessonProgressRequest;
import com.developersconnect.mentor.dto.StreamAnalyticsResponse;
import com.developersconnect.mentor.dto.StreamCheckoutInfoResponse;
import com.developersconnect.mentor.dto.StreamCourseCardResponse;
import com.developersconnect.mentor.dto.StreamCourseDetailResponse;
import com.developersconnect.mentor.dto.StreamPageResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.LearningStreamsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mentors/streams")
public class LearningStreamsController {

    private final LearningStreamsService streamsService;

    public LearningStreamsController(LearningStreamsService streamsService) {
        this.streamsService = streamsService;
    }

    private UUID currentUserId(Authentication auth) {
        return ((AuthPrincipal) auth.getPrincipal()).accountId();
    }

    @GetMapping("/courses")
    public StreamPageResponse<StreamCourseCardResponse> browse(
        Authentication auth,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String pricingType,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false, defaultValue = "latest") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return streamsService.browse(currentUserId(auth), search, pricingType, difficulty, sort, page, size);
    }

    @GetMapping("/courses/followed")
    public StreamPageResponse<StreamCourseCardResponse> followed(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return streamsService.followed(currentUserId(auth), page, size);
    }

    @GetMapping("/courses/recommended")
    public StreamPageResponse<StreamCourseCardResponse> recommended(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return streamsService.recommended(currentUserId(auth), page, size);
    }

    @GetMapping("/courses/purchased")
    public StreamPageResponse<StreamCourseCardResponse> purchased(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return streamsService.purchased(currentUserId(auth), page, size);
    }

    @GetMapping("/courses/trending")
    public StreamPageResponse<StreamCourseCardResponse> trending(
        Authentication auth,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size
    ) {
        return streamsService.browse(currentUserId(auth), null, null, null, "trending", page, size);
    }

    @GetMapping("/courses/continue")
    public List<StreamCourseCardResponse> continueLearning(Authentication auth) {
        return streamsService.continueLearning(currentUserId(auth));
    }

    @GetMapping("/courses/{id}")
    public StreamCourseDetailResponse detail(@PathVariable UUID id, Authentication auth) {
        return streamsService.getCourseDetail(currentUserId(auth), id);
    }

    @GetMapping("/courses/{id}/checkout")
    public StreamCheckoutInfoResponse checkout(@PathVariable UUID id, Authentication auth) {
        return streamsService.checkoutInfo(currentUserId(auth), id);
    }

    @PostMapping("/courses/{id}/purchase")
    public StreamCourseCardResponse purchase(
        @PathVariable UUID id,
        Authentication auth,
        @Valid @RequestBody ConfirmCoursePurchaseRequest request
    ) {
        return streamsService.confirmPurchase(currentUserId(auth), id, request.paymentId());
    }

    @PostMapping("/courses/{id}/enroll")
    public StreamCourseCardResponse enrollFree(@PathVariable UUID id, Authentication auth) {
        return streamsService.enrollFree(currentUserId(auth), id);
    }

    @PostMapping("/courses/{id}/cart")
    public ResponseEntity<Void> addToCart(@PathVariable UUID id, Authentication auth) {
        streamsService.addToCart(currentUserId(auth), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/cart/{courseId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable UUID courseId, Authentication auth) {
        streamsService.removeFromCart(currentUserId(auth), courseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cart")
    public List<StreamCourseCardResponse> cart(Authentication auth) {
        return streamsService.getCart(currentUserId(auth));
    }

    @PostMapping("/courses/{id}/save")
    public ResponseEntity<Void> save(@PathVariable UUID id, Authentication auth) {
        streamsService.saveCourse(currentUserId(auth), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/courses/{id}/save")
    public ResponseEntity<Void> unsave(@PathVariable UUID id, Authentication auth) {
        streamsService.unsaveCourse(currentUserId(auth), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mentors/{mentorId}/follow")
    public ResponseEntity<Void> follow(@PathVariable UUID mentorId, Authentication auth) {
        streamsService.followMentor(currentUserId(auth), mentorId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/mentors/{mentorId}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable UUID mentorId, Authentication auth) {
        streamsService.unfollowMentor(currentUserId(auth), mentorId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{id}/progress")
    public CourseProgressResponse courseProgress(@PathVariable UUID id, Authentication auth) {
        return streamsService.getCourseProgress(currentUserId(auth), id);
    }

    @GetMapping("/courses/{id}/resume")
    public ResumePlaybackResponse resume(@PathVariable UUID id, Authentication auth) {
        return streamsService.getResumePlayback(currentUserId(auth), id);
    }

    @PostMapping("/lessons/{lessonId}/complete")
    public LessonProgressResponse completeLesson(@PathVariable UUID lessonId, Authentication auth) {
        return streamsService.markLessonCompleted(currentUserId(auth), lessonId);
    }

    @PostMapping("/lessons/{lessonId}/progress")
    public LessonProgressResponse progress(
        @PathVariable UUID lessonId,
        Authentication auth,
        @Valid @RequestBody SaveLessonProgressRequest request
    ) {
        return streamsService.saveProgress(
            currentUserId(auth),
            lessonId,
            request.progressSeconds(),
            request.completed(),
            request.watchedDurationSeconds()
        );
    }

    @GetMapping("/analytics")
    public StreamAnalyticsResponse analytics(Authentication auth) {
        return streamsService.analytics(currentUserId(auth));
    }
}
