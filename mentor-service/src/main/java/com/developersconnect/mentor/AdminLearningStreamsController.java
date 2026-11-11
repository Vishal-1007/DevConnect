package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateStreamCourseRequest;
import com.developersconnect.mentor.dto.CreateStreamSectionBody;
import com.developersconnect.mentor.dto.StreamAnalyticsResponse;
import com.developersconnect.mentor.dto.StreamCourseCardResponse;
import com.developersconnect.mentor.dto.StreamCourseDetailResponse;
import com.developersconnect.mentor.dto.StreamLessonResponse;
import com.developersconnect.mentor.dto.StreamSectionResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.LearningStreamsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/mentors/admin/streams")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLearningStreamsController {

    private final LearningStreamsService streamsService;

    public AdminLearningStreamsController(LearningStreamsService streamsService) {
        this.streamsService = streamsService;
    }

    @GetMapping("/courses")
    public List<StreamCourseCardResponse> myCourses(Authentication auth) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return streamsService.adminCourses(principal.accountId());
    }

    @GetMapping("/courses/{id}")
    public StreamCourseDetailResponse courseDetail(@PathVariable UUID id, Authentication auth) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return streamsService.getAdminCourseDetail(principal.accountId(), id);
    }

    @GetMapping("/analytics")
    public StreamAnalyticsResponse analytics(Authentication auth) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return streamsService.analytics(principal.accountId());
    }

    @PostMapping("/courses")
    public ResponseEntity<StreamCourseCardResponse> create(
        Authentication auth,
        @Valid @RequestBody CreateStreamCourseRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(streamsService.createAdminCourse(principal.accountId(), principal.username(), request));
    }

    @PutMapping("/courses/{id}")
    public StreamCourseCardResponse update(
        Authentication auth,
        @PathVariable UUID id,
        @Valid @RequestBody CreateStreamCourseRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return streamsService.updateCourse(principal.accountId(), id, request);
    }

    @PostMapping("/courses/{courseId}/sections")
    public ResponseEntity<StreamSectionResponse> createSection(
        Authentication auth,
        @PathVariable UUID courseId,
        @Valid @RequestBody CreateStreamSectionBody request
    ) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        StreamSectionResponse section = streamsService.createSection(
            principal.accountId(), courseId, request.title(), request.sortOrder()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(section);
    }

    @PostMapping(value = "/courses/{courseId}/sections/{sectionId}/lessons", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamLessonResponse> uploadLesson(
        Authentication auth,
        @PathVariable UUID courseId,
        @PathVariable UUID sectionId,
        @RequestParam String title,
        @RequestParam(required = false) String description,
        @RequestParam(defaultValue = "0") int durationSeconds,
        @RequestParam(defaultValue = "0") int sortOrder,
        @RequestParam(defaultValue = "false") boolean previewFree,
        @RequestPart("video") MultipartFile video,
        @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        StreamLessonResponse lesson = streamsService.uploadLesson(
            principal.accountId(),
            courseId,
            sectionId,
            title,
            description,
            durationSeconds,
            sortOrder,
            previewFree,
            video,
            thumbnail
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(lesson);
    }

    @PostMapping("/courses/{id}/publish")
    public StreamCourseCardResponse publish(Authentication auth, @PathVariable UUID id) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return streamsService.publishCourse(principal.accountId(), id);
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable UUID id) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        streamsService.deleteCourse(principal.accountId(), id);
        return ResponseEntity.noContent().build();
    }
}
