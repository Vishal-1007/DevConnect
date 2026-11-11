package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.LearningCategoryResponse;
import com.developersconnect.mentor.dto.LearningResourceDetailResponse;
import com.developersconnect.mentor.dto.LearningResourceResponse;
import com.developersconnect.mentor.dto.LearningVideoDetailResponse;
import com.developersconnect.mentor.dto.LearningVideoResponse;
import com.developersconnect.mentor.model.LearningResource;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.AdminLearningResourceService;
import com.developersconnect.mentor.service.AdminLearningVideoService;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/learning")
public class LearningContentController {

    private final AdminLearningResourceService resourceService;
    private final AdminLearningVideoService videoService;

    public LearningContentController(
        AdminLearningResourceService resourceService,
        AdminLearningVideoService videoService
    ) {
        this.resourceService = resourceService;
        this.videoService = videoService;
    }

    @GetMapping("/resource-categories")
    public List<LearningCategoryResponse> resourceCategories() {
        return resourceService.listCategories();
    }

    @GetMapping("/video-categories")
    public List<LearningCategoryResponse> videoCategories() {
        return videoService.listCategories();
    }

    @GetMapping("/resources")
    public List<LearningResourceResponse> listResources(
        Authentication auth,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) String q
    ) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return resourceService.listPublicResources(userId, categoryId, q);
    }

    @GetMapping("/resources/{id}")
    public LearningResourceDetailResponse getResource(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return resourceService.getPublicResource(userId, id);
    }

    @GetMapping("/resources/{id}/preview")
    public ResponseEntity<Resource> previewResource(@PathVariable UUID id) {
        LearningResource resource = resourceService.findResource(id);
        if (!"PUBLIC".equals(resource.getVisibility()) && !"PREMIUM".equals(resource.getVisibility())) {
            return ResponseEntity.notFound().build();
        }
        return serveResource(resource, true);
    }

    @GetMapping("/resources/{id}/download")
    public ResponseEntity<Resource> downloadResource(@PathVariable UUID id) {
        LearningResource resource = resourceService.findResource(id);
        if (!"PUBLIC".equals(resource.getVisibility()) && !"PREMIUM".equals(resource.getVisibility())) {
            return ResponseEntity.notFound().build();
        }
        resourceService.recordDownload(id);
        return serveResource(resource, false);
    }

    private ResponseEntity<Resource> serveResource(LearningResource resource, boolean inline) {
        Path path = resourceService.resolveResourceFile(resource);
        FileSystemResource file = new FileSystemResource(path);
        MediaType mediaType = resolveMediaType(resource.getFileType(), path.getFileName().toString());
        ResponseEntity.BodyBuilder builder = ResponseEntity.ok().contentType(mediaType);
        if (inline) {
            builder.header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"");
        } else {
            builder.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.getFileName() + "\"");
        }
        return builder.body(file);
    }

    private MediaType resolveMediaType(String fileType, String filename) {
        if ("pdf".equalsIgnoreCase(fileType)) {
            return MediaType.APPLICATION_PDF;
        }
        return MediaTypeFactory.getMediaType(filename).orElse(MediaType.APPLICATION_OCTET_STREAM);
    }

    @PostMapping("/resources/{id}/save")
    public ResponseEntity<Void> saveResource(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        resourceService.saveResource(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resources/{id}/unsave")
    public ResponseEntity<Void> unsaveResource(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        resourceService.unsaveResource(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/videos")
    public List<LearningVideoResponse> listVideos(
        Authentication auth,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "latest") String sort
    ) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return videoService.listPublicVideos(userId, categoryId, q, sort);
    }

    @GetMapping("/videos/{id}")
    public LearningVideoDetailResponse getVideo(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return videoService.getPublicVideo(userId, id);
    }

    @PostMapping("/videos/{id}/save")
    public ResponseEntity<Void> saveVideo(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        videoService.saveVideo(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/videos/{id}/unsave")
    public ResponseEntity<Void> unsaveVideo(Authentication auth, @PathVariable UUID id) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        videoService.unsaveVideo(userId, id);
        return ResponseEntity.noContent().build();
    }
}
