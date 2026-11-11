package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateLearningCategoryRequest;
import com.developersconnect.mentor.dto.LearningCategoryResponse;
import com.developersconnect.mentor.dto.LearningVideoAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningVideoResponse;
import com.developersconnect.mentor.dto.UpdateLearningVideoRequest;
import com.developersconnect.mentor.service.AdminLearningVideoService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/mentors/admin/learning-videos")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLearningVideoController {

    private final AdminLearningVideoService videoService;

    public AdminLearningVideoController(AdminLearningVideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/analytics")
    public LearningVideoAnalyticsResponse analytics() {
        return videoService.analytics();
    }

    @GetMapping("/categories")
    public List<LearningCategoryResponse> categories() {
        return videoService.listCategories();
    }

    @PostMapping("/categories")
    public ResponseEntity<LearningCategoryResponse> createCategory(
        @Valid @RequestBody CreateLearningCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(videoService.createCategory(request));
    }

    @GetMapping
    public List<LearningVideoResponse> list(
        @RequestParam(required = false) String visibility,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) String q
    ) {
        return videoService.listVideos(visibility, categoryId, q);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LearningVideoResponse> upload(
        @RequestParam String title,
        @RequestParam(required = false) String description,
        @RequestParam UUID categoryId,
        @RequestParam(required = false) String tags,
        @RequestParam(defaultValue = "0") int durationSeconds,
        @RequestParam(defaultValue = "DRAFT") String visibility,
        @RequestPart("video") MultipartFile video,
        @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            videoService.uploadVideo(title, description, categoryId, tags, durationSeconds, visibility, video, thumbnail)
        );
    }

    @PutMapping("/{id}")
    public LearningVideoResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateLearningVideoRequest request
    ) {
        return videoService.updateVideo(id, request);
    }

    @PostMapping("/{id}/publish")
    public LearningVideoResponse publish(@PathVariable UUID id) {
        return videoService.publishVideo(id);
    }

    @PostMapping("/{id}/unpublish")
    public LearningVideoResponse unpublish(@PathVariable UUID id) {
        return videoService.unpublishVideo(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        videoService.deleteVideo(id);
        return ResponseEntity.noContent().build();
    }
}
