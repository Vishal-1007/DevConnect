package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateLearningCategoryRequest;
import com.developersconnect.mentor.dto.LearningCategoryResponse;
import com.developersconnect.mentor.dto.LearningVideoAnalyticsResponse;
import com.developersconnect.mentor.dto.LearningVideoDetailResponse;
import com.developersconnect.mentor.dto.LearningVideoResponse;
import com.developersconnect.mentor.dto.UpdateLearningVideoRequest;
import com.developersconnect.mentor.model.LearningVideo;
import com.developersconnect.mentor.model.LearningVideoCategory;
import com.developersconnect.mentor.model.SavedLearningVideo;
import com.developersconnect.mentor.repository.LearningVideoCategoryRepository;
import com.developersconnect.mentor.repository.LearningVideoRepository;
import com.developersconnect.mentor.repository.SavedLearningVideoRepository;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminLearningVideoService {

    private final LearningVideoRepository videoRepository;
    private final LearningVideoCategoryRepository categoryRepository;
    private final SavedLearningVideoRepository savedRepository;
    private final StreamMediaStorageService mediaStorage;

    public AdminLearningVideoService(
        LearningVideoRepository videoRepository,
        LearningVideoCategoryRepository categoryRepository,
        SavedLearningVideoRepository savedRepository,
        StreamMediaStorageService mediaStorage
    ) {
        this.videoRepository = videoRepository;
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
        LearningVideoCategory category = new LearningVideoCategory();
        category.setName(request.name().trim());
        category.setSortOrder(request.sortOrder());
        LearningVideoCategory saved = categoryRepository.save(category);
        return new LearningCategoryResponse(saved.getId(), saved.getName(), saved.getSortOrder());
    }

    @Transactional(readOnly = true)
    public List<LearningVideoResponse> listVideos(String visibility, UUID categoryId, String q) {
        return videoRepository.search(emptyToNull(visibility), categoryId, emptyToNull(q)).stream()
            .map(v -> toResponse(v, false))
            .toList();
    }

    @Transactional(readOnly = true)
    public LearningVideoAnalyticsResponse analytics() {
        List<LearningVideo> all = videoRepository.findAll();
        long watchSeconds = all.stream().mapToLong(v -> (long) v.getDurationSeconds() * v.getViewCount()).sum();
        long views = all.stream().mapToLong(LearningVideo::getViewCount).sum();
        return new LearningVideoAnalyticsResponse(
            all.size(),
            views,
            watchSeconds,
            all.stream().filter(v -> "PUBLIC".equals(v.getVisibility())).count(),
            all.stream().filter(v -> "PREMIUM".equals(v.getVisibility())).count(),
            all.stream().filter(v -> "DRAFT".equals(v.getVisibility())).count()
        );
    }

    @Transactional
    public LearningVideoResponse uploadVideo(
        String title,
        String description,
        UUID categoryId,
        String tags,
        int durationSeconds,
        String visibility,
        MultipartFile video,
        MultipartFile thumbnail
    ) {
        LearningVideo entity = new LearningVideo();
        entity.setTitle(title);
        entity.setDescription(description);
        applyCategory(entity, categoryId);
        entity.setTags(tags);
        entity.setDurationSeconds(Math.max(durationSeconds, 0));
        entity.setVisibility(visibility != null ? visibility : "DRAFT");
        entity.setVideoUrl(mediaStorage.storeVideo(video));
        entity.setThumbnailUrl(mediaStorage.storeThumbnail(thumbnail));
        return toResponse(videoRepository.save(entity), false);
    }

    @Transactional
    public LearningVideoResponse updateVideo(UUID id, UpdateLearningVideoRequest request) {
        LearningVideo video = findVideo(id);
        if (request.title() != null) video.setTitle(request.title());
        if (request.description() != null) video.setDescription(request.description());
        if (request.categoryId() != null) applyCategory(video, request.categoryId());
        if (request.tags() != null) video.setTags(String.join(",", request.tags()));
        if (request.durationSeconds() >= 0) video.setDurationSeconds(request.durationSeconds());
        if (request.visibility() != null) video.setVisibility(request.visibility());
        return toResponse(videoRepository.save(video), false);
    }

    @Transactional
    public LearningVideoResponse publishVideo(UUID id) {
        LearningVideo video = findVideo(id);
        video.setVisibility("PUBLIC");
        return toResponse(videoRepository.save(video), false);
    }

    @Transactional
    public LearningVideoResponse unpublishVideo(UUID id) {
        LearningVideo video = findVideo(id);
        video.setVisibility("DRAFT");
        return toResponse(videoRepository.save(video), false);
    }

    @Transactional
    public void deleteVideo(UUID id) {
        videoRepository.delete(findVideo(id));
    }

    @Transactional(readOnly = true)
    public List<LearningVideoResponse> listPublicVideos(UUID learnerId, UUID categoryId, String q, String sort) {
        List<LearningVideo> videos = videoRepository.search(null, categoryId, emptyToNull(q)).stream()
            .filter(v -> isVisibleToUser(v.getVisibility()))
            .toList();
        if ("trending".equalsIgnoreCase(sort)) {
            videos = videos.stream()
                .sorted((a, b) -> Integer.compare(b.getViewCount(), a.getViewCount()))
                .toList();
        }
        return videos.stream()
            .map(v -> toResponse(v, savedRepository.existsByIdLearnerIdAndIdVideoId(learnerId, v.getId())))
            .toList();
    }

    @Transactional
    public LearningVideoDetailResponse getPublicVideo(UUID learnerId, UUID id) {
        LearningVideo video = findVideo(id);
        if (!isVisibleToUser(video.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Video not available");
        }
        video.setViewCount(video.getViewCount() + 1);
        videoRepository.save(video);
        boolean saved = savedRepository.existsByIdLearnerIdAndIdVideoId(learnerId, id);
        List<LearningVideoResponse> related = videoRepository.search(null, video.getCategoryId(), null).stream()
            .filter(v -> !v.getId().equals(id) && isVisibleToUser(v.getVisibility()))
            .limit(6)
            .map(v -> toResponse(v, savedRepository.existsByIdLearnerIdAndIdVideoId(learnerId, v.getId())))
            .toList();
        return toDetail(video, saved, related);
    }

    @Transactional
    public void saveVideo(UUID learnerId, UUID videoId) {
        findVideo(videoId);
        if (savedRepository.existsByIdLearnerIdAndIdVideoId(learnerId, videoId)) return;
        SavedLearningVideo saved = new SavedLearningVideo();
        saved.setId(new SavedLearningVideo.Id(learnerId, videoId));
        savedRepository.save(saved);
    }

    @Transactional
    public void unsaveVideo(UUID learnerId, UUID videoId) {
        savedRepository.deleteByIdLearnerIdAndIdVideoId(learnerId, videoId);
    }

    public LearningVideo findVideo(UUID id) {
        return videoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
    }

    public String resolveVideoStreamUrl(LearningVideo video) {
        if (video.getVideoUrl() == null) return null;
        if (mediaStorage.isLocalMedia(video.getVideoUrl())) {
            return "/api/videos/platform/" + video.getId();
        }
        return video.getVideoUrl();
    }

    private void applyCategory(LearningVideo video, UUID categoryId) {
        LearningVideoCategory category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category"));
        video.setCategoryId(category.getId());
        video.setCategoryName(category.getName());
    }

    private LearningVideoResponse toResponse(LearningVideo v, boolean saved) {
        return new LearningVideoResponse(
            v.getId(), v.getTitle(), v.getDescription(), v.getCategoryId(), v.getCategoryName(),
            parseTags(v.getTags()), resolveMediaUrl(v.getThumbnailUrl()), v.getDurationSeconds(),
            v.getVisibility(), v.getViewCount(), v.getLikeCount(), saved, v.getCreatedAt()
        );
    }

    private LearningVideoDetailResponse toDetail(
        LearningVideo v, boolean saved, List<LearningVideoResponse> related
    ) {
        return new LearningVideoDetailResponse(
            v.getId(), v.getTitle(), v.getDescription(), v.getCategoryId(), v.getCategoryName(),
            parseTags(v.getTags()), resolveVideoStreamUrl(v), resolveMediaUrl(v.getThumbnailUrl()),
            v.getDurationSeconds(), v.getVisibility(), v.getViewCount(), v.getLikeCount(),
            saved, v.getCreatedAt(), related
        );
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
}
