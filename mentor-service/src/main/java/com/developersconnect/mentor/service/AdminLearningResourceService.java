package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateLearningCategoryRequest;
import com.developersconnect.mentor.dto.LearningCategoryResponse;
import com.developersconnect.mentor.dto.LearningResourceAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningResourceDetailResponse;
import com.developersconnect.mentor.dto.LearningResourceResponse;
import com.developersconnect.mentor.dto.LearningVideoAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningVideoDetailResponse;
import com.developersconnect.mentor.dto.LearningVideoResponse;
import com.developersconnect.mentor.dto.UpdateLearningResourceRequest;
import com.developersconnect.mentor.dto.UpdateLearningVideoRequest;
import com.developersconnect.mentor.model.LearningResource;
import com.developersconnect.mentor.model.LearningResourceCategory;
import com.developersconnect.mentor.model.LearningVideo;
import com.developersconnect.mentor.model.LearningVideoCategory;
import com.developersconnect.mentor.model.SavedLearningResource;
import com.developersconnect.mentor.model.SavedLearningVideo;
import com.developersconnect.mentor.repository.LearningResourceCategoryRepository;
import com.developersconnect.mentor.repository.LearningResourceRepository;
import com.developersconnect.mentor.repository.LearningVideoCategoryRepository;
import com.developersconnect.mentor.repository.LearningVideoRepository;
import com.developersconnect.mentor.repository.SavedLearningResourceRepository;
import com.developersconnect.mentor.repository.SavedLearningVideoRepository;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminLearningResourceService {

    private static final Logger log = LoggerFactory.getLogger(AdminLearningResourceService.class);

    private final LearningResourceRepository resourceRepository;
    private final LearningResourceCategoryRepository categoryRepository;
    private final SavedLearningResourceRepository savedRepository;
    private final StreamMediaStorageService mediaStorage;

    public AdminLearningResourceService(
        LearningResourceRepository resourceRepository,
        LearningResourceCategoryRepository categoryRepository,
        SavedLearningResourceRepository savedRepository,
        StreamMediaStorageService mediaStorage
    ) {
        this.resourceRepository = resourceRepository;
        this.categoryRepository = categoryRepository;
        this.savedRepository = savedRepository;
        this.mediaStorage = mediaStorage;
    }

    @Transactional(readOnly = true)
    public List<LearningCategoryResponse> listCategories() {
        return categoryRepository.findAll().stream()
            .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
            .map(c -> new LearningCategoryResponse(c.getId(), c.getName(), c.getSortOrder()))
            .toList();
    }

    @Transactional
    public LearningCategoryResponse createCategory(CreateLearningCategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }
        LearningResourceCategory category = new LearningResourceCategory();
        category.setName(request.name().trim());
        category.setSortOrder(request.sortOrder());
        LearningResourceCategory saved = categoryRepository.save(category);
        return new LearningCategoryResponse(saved.getId(), saved.getName(), saved.getSortOrder());
    }

    @Transactional(readOnly = true)
    public List<LearningResourceResponse> listResources(String visibility, UUID categoryId, String q) {
        return resourceRepository.search(emptyToNull(visibility), categoryId, emptyToNull(q)).stream()
            .map(r -> toResponse(r, false))
            .toList();
    }

    @Transactional(readOnly = true)
    public LearningResourceAnalyticsResponse analytics() {
        List<LearningResource> all = resourceRepository.findAll();
        long downloads = all.stream().mapToLong(LearningResource::getDownloadCount).sum();
        long views = all.stream().mapToLong(LearningResource::getViewCount).sum();
        return new LearningResourceAnalyticsResponse(
            all.size(),
            downloads,
            views,
            all.stream().filter(r -> "PUBLIC".equals(r.getVisibility())).count(),
            all.stream().filter(r -> "PREMIUM".equals(r.getVisibility())).count(),
            all.stream().filter(r -> "DRAFT".equals(r.getVisibility())).count()
        );
    }

    @Transactional
    public LearningResourceResponse uploadResource(
        String title,
        String description,
        UUID categoryId,
        String tags,
        String difficulty,
        String visibility,
        MultipartFile file,
        MultipartFile thumbnail
    ) {
        LearningResource resource = new LearningResource();
        resource.setTitle(title);
        resource.setDescription(description);
        applyCategory(resource, categoryId);
        resource.setTags(tags);
        resource.setDifficulty(difficulty != null ? difficulty : "BEGINNER");
        resource.setVisibility(visibility != null ? visibility : "DRAFT");
        resource.setFileUrl(mediaStorage.storeResource(file));
        resource.setFileType(extension(file.getOriginalFilename()));
        resource.setThumbnailUrl(mediaStorage.storeThumbnail(thumbnail));
        LearningResource saved = resourceRepository.save(resource);
        log.info("Stored learning resource file at uploads/{} (id={})", saved.getFileUrl(), saved.getId());
        return toResponse(saved, false);
    }

    @Transactional
    public LearningResourceResponse updateResource(UUID id, UpdateLearningResourceRequest request) {
        LearningResource resource = findResource(id);
        if (request.title() != null) resource.setTitle(request.title());
        if (request.description() != null) resource.setDescription(request.description());
        if (request.categoryId() != null) applyCategory(resource, request.categoryId());
        if (request.tags() != null) resource.setTags(String.join(",", request.tags()));
        if (request.difficulty() != null) resource.setDifficulty(request.difficulty());
        if (request.visibility() != null) resource.setVisibility(request.visibility());
        return toResponse(resourceRepository.save(resource), false);
    }

    @Transactional
    public LearningResourceResponse publishResource(UUID id) {
        LearningResource resource = findResource(id);
        resource.setVisibility("PUBLIC");
        return toResponse(resourceRepository.save(resource), false);
    }

    @Transactional
    public LearningResourceResponse unpublishResource(UUID id) {
        LearningResource resource = findResource(id);
        resource.setVisibility("DRAFT");
        return toResponse(resourceRepository.save(resource), false);
    }

    @Transactional
    public void deleteResource(UUID id) {
        resourceRepository.delete(findResource(id));
    }

    @Transactional(readOnly = true)
    public List<LearningResourceResponse> listPublicResources(UUID learnerId, UUID categoryId, String q) {
        return resourceRepository.search(null, categoryId, emptyToNull(q)).stream()
            .filter(r -> isVisibleToUser(r.getVisibility()))
            .map(r -> toResponse(r, savedRepository.existsByIdLearnerIdAndIdResourceId(learnerId, r.getId())))
            .toList();
    }

    @Transactional
    public LearningResourceDetailResponse getPublicResource(UUID learnerId, UUID id) {
        LearningResource resource = findResource(id);
        if (!isVisibleToUser(resource.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Resource not available");
        }
        resource.setViewCount(resource.getViewCount() + 1);
        resourceRepository.save(resource);
        boolean saved = savedRepository.existsByIdLearnerIdAndIdResourceId(learnerId, id);
        List<LearningResourceResponse> related = resourceRepository.search(null, resource.getCategoryId(), null).stream()
            .filter(r -> !r.getId().equals(id) && isVisibleToUser(r.getVisibility()))
            .limit(4)
            .map(r -> toResponse(r, savedRepository.existsByIdLearnerIdAndIdResourceId(learnerId, r.getId())))
            .toList();
        return toDetail(resource, saved, related);
    }

    @Transactional
    public void recordDownload(UUID id) {
        LearningResource resource = findResource(id);
        resource.setDownloadCount(resource.getDownloadCount() + 1);
        resourceRepository.save(resource);
    }

    @Transactional
    public void saveResource(UUID learnerId, UUID resourceId) {
        findResource(resourceId);
        if (savedRepository.existsByIdLearnerIdAndIdResourceId(learnerId, resourceId)) return;
        SavedLearningResource saved = new SavedLearningResource();
        saved.setId(new SavedLearningResource.Id(learnerId, resourceId));
        savedRepository.save(saved);
    }

    @Transactional
    public void unsaveResource(UUID learnerId, UUID resourceId) {
        savedRepository.deleteByIdLearnerIdAndIdResourceId(learnerId, resourceId);
    }

    public LearningResource findResource(UUID id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    private void applyCategory(LearningResource resource, UUID categoryId) {
        LearningResourceCategory category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category"));
        resource.setCategoryId(category.getId());
        resource.setCategoryName(category.getName());
    }

    private LearningResourceResponse toResponse(LearningResource r, boolean saved) {
        return new LearningResourceResponse(
            r.getId(), r.getTitle(), r.getDescription(), r.getCategoryId(), r.getCategoryName(),
            parseTags(r.getTags()), r.getDifficulty(), r.getFileType(), resolveMediaUrl(r.getThumbnailUrl()),
            r.getVisibility(), r.getDownloadCount(), r.getViewCount(), saved, r.getCreatedAt()
        );
    }

    private LearningResourceDetailResponse toDetail(
        LearningResource r, boolean saved, List<LearningResourceResponse> related
    ) {
        return new LearningResourceDetailResponse(
            r.getId(), r.getTitle(), r.getDescription(), r.getCategoryId(), r.getCategoryName(),
            parseTags(r.getTags()), r.getDifficulty(), r.getFileType(),
            resolvePreviewUrl(r), resolveDownloadUrl(r.getId()), resolveMediaUrl(r.getThumbnailUrl()),
            r.getVisibility(), r.getDownloadCount(), r.getViewCount(), saved, r.getCreatedAt(), related
        );
    }

    private String resolvePreviewUrl(LearningResource r) {
        if (r.getFileUrl() == null) return null;
        if (mediaStorage.isLocalMedia(r.getFileUrl())) {
            if ("PUBLIC".equals(r.getVisibility())) {
                return "/uploads/" + r.getFileUrl();
            }
            return "/api/mentors/learning/resources/" + r.getId() + "/preview";
        }
        return r.getFileUrl();
    }

    private String resolveDownloadUrl(UUID resourceId) {
        return "/api/mentors/learning/resources/" + resourceId + "/download";
    }

    public Path resolveResourceFile(LearningResource resource) {
        log.debug("Resolving resource file uploads/{} for id={}", resource.getFileUrl(), resource.getId());
        return mediaStorage.resolveStoredPath(resource.getFileUrl());
    }

    private String resolveMediaUrl(String url) {
        if (url == null || url.isBlank()) return null;
        if (mediaStorage.isLocalMedia(url)) {
            return "/api/mentors/learning/media/" + url;
        }
        return url;
    }

    private boolean isVisibleToUser(String visibility) {
        return "PUBLIC".equals(visibility) || "PREMIUM".equals(visibility);
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
