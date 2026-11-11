package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateLearningCategoryRequest;
import com.developersconnect.mentor.dto.LearningCategoryResponse;
import com.developersconnect.mentor.dto.LearningResourceAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningResourceResponse;
import com.developersconnect.mentor.dto.LearningVideoAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningVideoResponse;
import com.developersconnect.mentor.dto.UpdateLearningResourceRequest;
import com.developersconnect.mentor.dto.UpdateLearningVideoRequest;
import com.developersconnect.mentor.service.AdminLearningResourceService;
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
@RequestMapping("/api/mentors/admin/learning-resources")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLearningResourceController {

    private final AdminLearningResourceService resourceService;

    public AdminLearningResourceController(AdminLearningResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping("/analytics")
    public LearningResourceAnalyticsResponse analytics() {
        return resourceService.analytics();
    }

    @GetMapping("/categories")
    public List<LearningCategoryResponse> categories() {
        return resourceService.listCategories();
    }

    @PostMapping("/categories")
    public ResponseEntity<LearningCategoryResponse> createCategory(
        @Valid @RequestBody CreateLearningCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createCategory(request));
    }

    @GetMapping
    public List<LearningResourceResponse> list(
        @RequestParam(required = false) String visibility,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) String q
    ) {
        return resourceService.listResources(visibility, categoryId, q);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LearningResourceResponse> upload(
        @RequestParam String title,
        @RequestParam(required = false) String description,
        @RequestParam UUID categoryId,
        @RequestParam(required = false) String tags,
        @RequestParam(defaultValue = "BEGINNER") String difficulty,
        @RequestParam(defaultValue = "DRAFT") String visibility,
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            resourceService.uploadResource(title, description, categoryId, tags, difficulty, visibility, file, thumbnail)
        );
    }

    @PutMapping("/{id}")
    public LearningResourceResponse update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateLearningResourceRequest request
    ) {
        return resourceService.updateResource(id, request);
    }

    @PostMapping("/{id}/publish")
    public LearningResourceResponse publish(@PathVariable UUID id) {
        return resourceService.publishResource(id);
    }

    @PostMapping("/{id}/unpublish")
    public LearningResourceResponse unpublish(@PathVariable UUID id) {
        return resourceService.unpublishResource(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
