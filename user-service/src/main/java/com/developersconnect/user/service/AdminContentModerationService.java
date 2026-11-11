package com.developersconnect.user.service;

import com.developersconnect.user.dto.AdminModeratedPostResponse;
import com.developersconnect.user.dto.ContentModerationAnalyticsResponse;
import com.developersconnect.user.model.CommunityPost;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityPostCommentRepository;
import com.developersconnect.user.repository.CommunityPostLikeRepository;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.service.ContentModerationScanner.ModerationScanResult;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminContentModerationService {

    private static final Set<String> MODERATION_CATEGORIES = Set.of(
        "abusive_language", "spam", "hate_speech", "scam", "nsfw"
    );

    private final CommunityPostRepository postRepository;
    private final CommunityPostLikeRepository likeRepository;
    private final CommunityPostCommentRepository commentRepository;
    private final UserProfileRepository userProfileRepository;
    private final ContentModerationScanner moderationScanner;

    public AdminContentModerationService(
        CommunityPostRepository postRepository,
        CommunityPostLikeRepository likeRepository,
        CommunityPostCommentRepository commentRepository,
        UserProfileRepository userProfileRepository,
        ContentModerationScanner moderationScanner
    ) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userProfileRepository = userProfileRepository;
        this.moderationScanner = moderationScanner;
    }

    @Transactional(readOnly = true)
    public List<AdminModeratedPostResponse> listPosts(String status, String category, String q, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        String normalizedStatus = normalizeStatus(status);
        String normalizedCategory = normalizeCategoryFilter(category);
        String query = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";

        return postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, safeLimit)).stream()
            .filter(post -> matchesStatus(post, normalizedStatus))
            .filter(post -> matchesCategory(post, normalizedCategory))
            .filter(post -> matchesQuery(post, query))
            .sorted(Comparator.comparing(CommunityPost::getCreatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminModeratedPostResponse getPost(UUID postId) {
        return toResponse(findPost(postId));
    }

    @Transactional(readOnly = true)
    public ContentModerationAnalyticsResponse getAnalytics() {
        List<CommunityPost> posts = postRepository.findAll();
        long removed = posts.stream().filter(CommunityPost::isRemoved).count();
        long active = posts.size() - removed;
        long flagged = posts.stream().filter(p -> p.isFlagged() && !p.isRemoved()).count();
        long autoFlagged = posts.stream().filter(p -> p.isAutoFlagged() && !p.isRemoved()).count();

        return new ContentModerationAnalyticsResponse(
            posts.size(),
            active,
            flagged,
            autoFlagged,
            removed,
            countByFlag(posts, "abusive_language"),
            countByFlag(posts, "hate_speech"),
            countByFlag(posts, "spam"),
            countByFlag(posts, "scam"),
            countByFlag(posts, "nsfw")
        );
    }

    @Transactional
    public AdminModeratedPostResponse flagPost(UUID postId) {
        CommunityPost post = findPost(postId);
        if (post.isRemoved()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Removed posts cannot be flagged");
        }
        post.setFlagged(true);
        post.setAutoFlagged(false);
        post.setModerationStatus("flagged");
        post.setFlaggedAt(Instant.now());
        if (post.getModerationFlags().isEmpty()) {
            post.setModerationFlags(new LinkedHashSet<>(Set.of("manual_review")));
        }
        if (post.getModerationNote() == null || post.getModerationNote().isBlank()) {
            post.setModerationNote("Manually flagged by admin");
        }
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public AdminModeratedPostResponse unflagPost(UUID postId) {
        CommunityPost post = findPost(postId);
        post.setFlagged(false);
        post.setAutoFlagged(false);
        post.setModerationStatus("clear");
        post.setModerationFlags(new LinkedHashSet<>());
        post.setModerationNote(null);
        post.setFlaggedAt(null);
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public AdminModeratedPostResponse removePost(UUID postId) {
        CommunityPost post = findPost(postId);
        post.setRemoved(true);
        post.setModerationStatus("removed");
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public AdminModeratedPostResponse restorePost(UUID postId) {
        CommunityPost post = findPost(postId);
        post.setRemoved(false);
        post.setModerationStatus(post.isFlagged() ? "flagged" : "clear");
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public AdminModeratedPostResponse scanPost(UUID postId) {
        CommunityPost post = findPost(postId);
        ModerationScanResult result = moderationScanner.scan(post.getContent());
        if (result.flagged()) {
            moderationScanner.applyScanResult(post, result);
        } else if (!post.isFlagged()) {
            post.setModerationStatus("clear");
            post.setModerationFlags(new LinkedHashSet<>());
            post.setModerationNote(null);
            post.setFlaggedAt(null);
        }
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public ContentModerationAnalyticsResponse scanAllPosts() {
        postRepository.findAll().forEach(post -> {
            ModerationScanResult result = moderationScanner.scan(post.getContent());
            if (result.flagged()) {
                moderationScanner.applyScanResult(post, result);
                postRepository.save(post);
            }
        });
        return getAnalytics();
    }

    private CommunityPost findPost(UUID postId) {
        return postRepository.findById(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private boolean matchesStatus(CommunityPost post, String status) {
        return switch (status) {
            case "flagged" -> post.isFlagged() && !post.isRemoved();
            case "auto_flagged" -> post.isAutoFlagged() && !post.isRemoved();
            case "removed" -> post.isRemoved();
            case "clear" -> !post.isFlagged() && !post.isRemoved();
            case "all" -> true;
            default -> !post.isRemoved();
        };
    }

    private boolean matchesCategory(CommunityPost post, String category) {
        if (category == null || category.isBlank() || "all".equals(category)) {
            return true;
        }
        return post.getModerationFlags().contains(category);
    }

    private boolean matchesQuery(CommunityPost post, String query) {
        if (query.isBlank()) {
            return true;
        }
        UserProfile author = userProfileRepository.findById(post.getAuthorId()).orElse(null);
        String displayName = author != null && author.getDisplayName() != null
            ? author.getDisplayName().toLowerCase(Locale.ROOT)
            : author != null ? author.getUsername().toLowerCase(Locale.ROOT) : "";
        return post.getContent().toLowerCase(Locale.ROOT).contains(query)
            || displayName.contains(query)
            || post.getCategory().toLowerCase(Locale.ROOT).contains(query);
    }

    private long countByFlag(List<CommunityPost> posts, String flag) {
        return posts.stream()
            .filter(p -> !p.isRemoved() && p.getModerationFlags().contains(flag))
            .count();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "active";
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCategoryFilter(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return "all";
        }
        String normalized = category.trim().toLowerCase(Locale.ROOT);
        if (!MODERATION_CATEGORIES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid moderation category");
        }
        return normalized;
    }

    private AdminModeratedPostResponse toResponse(CommunityPost post) {
        UserProfile author = userProfileRepository.findById(post.getAuthorId()).orElse(null);
        String displayName = author != null && author.getDisplayName() != null
            ? author.getDisplayName()
            : author != null ? author.getUsername() : "Developer";
        String role = author != null ? author.getRole() : null;
        return new AdminModeratedPostResponse(
            post.getId(),
            post.getAuthorId(),
            displayName,
            role,
            post.getContent(),
            post.getCategory(),
            Set.copyOf(post.getTags()),
            likeRepository.countByPostId(post.getId()),
            commentRepository.countByPostId(post.getId()),
            post.isRemoved(),
            post.isFlagged(),
            post.isAutoFlagged(),
            post.getModerationStatus(),
            Set.copyOf(post.getModerationFlags()),
            post.getModerationNote(),
            post.getFlaggedAt(),
            post.getCreatedAt(),
            post.getUpdatedAt()
        );
    }
}
