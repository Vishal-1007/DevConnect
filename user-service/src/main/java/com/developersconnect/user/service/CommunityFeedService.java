package com.developersconnect.user.service;



import com.developersconnect.user.dto.CommunityCommentResponse;

import com.developersconnect.user.dto.CommunityFeedStatsResponse;

import com.developersconnect.user.dto.CommunityPostAttachmentResponse;

import com.developersconnect.user.dto.CommunityPostCodeResponse;

import com.developersconnect.user.dto.CommunityPostPollCreateRequest;

import com.developersconnect.user.dto.CommunityPostPollOptionResponse;

import com.developersconnect.user.dto.CommunityPostPollResponse;

import com.developersconnect.user.dto.CommunityPostResponse;

import com.developersconnect.user.dto.CommunityPostUploadResponse;

import com.developersconnect.user.dto.CreateCommunityCommentRequest;

import com.developersconnect.user.dto.CreateCommunityPostRequest;

import com.developersconnect.user.dto.TrendingTagResponse;

import com.developersconnect.user.model.CommunityPost;

import com.developersconnect.user.model.CommunityPostComment;

import com.developersconnect.user.model.CommunityPostFile;

import com.developersconnect.user.model.CommunityPostLike;

import com.developersconnect.user.model.CommunityPostPoll;

import com.developersconnect.user.model.CommunityPostPollOption;

import com.developersconnect.user.model.CommunityPostPollVote;

import com.developersconnect.user.model.CommunityPostSaved;

import com.developersconnect.user.model.UserProfile;

import com.developersconnect.user.repository.CommunityPostCommentRepository;

import com.developersconnect.user.repository.CommunityPostLikeRepository;

import com.developersconnect.user.repository.CommunityPostPollOptionRepository;

import com.developersconnect.user.repository.CommunityPostPollRepository;

import com.developersconnect.user.repository.CommunityPostPollVoteRepository;

import com.developersconnect.user.repository.CommunityPostRepository;

import com.developersconnect.user.repository.CommunityPostSavedRepository;

import com.developersconnect.user.repository.UserProfileRepository;

import java.time.Instant;

import java.time.temporal.ChronoUnit;

import java.util.ArrayList;

import java.util.Comparator;

import java.util.HashMap;

import java.util.LinkedHashSet;

import java.util.List;

import java.util.Locale;

import java.util.Map;

import java.util.Optional;

import java.util.Set;

import java.util.UUID;

import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;

import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import org.springframework.web.server.ResponseStatusException;



@Service

public class CommunityFeedService {



    private static final int MAX_CODE_LINES = 500;



    private final CommunityPostRepository postRepository;

    private final CommunityPostLikeRepository likeRepository;

    private final CommunityPostCommentRepository commentRepository;

    private final CommunityPostSavedRepository savedRepository;

    private final CommunityPostPollRepository pollRepository;

    private final CommunityPostPollOptionRepository pollOptionRepository;

    private final CommunityPostPollVoteRepository pollVoteRepository;

    private final UserProfileRepository userProfileRepository;

    private final ContentModerationScanner moderationScanner;

    private final CommunityPostFileStorageService fileStorageService;

    private final UserStreakService userStreakService;



    public CommunityFeedService(

        CommunityPostRepository postRepository,

        CommunityPostLikeRepository likeRepository,

        CommunityPostCommentRepository commentRepository,

        CommunityPostSavedRepository savedRepository,

        CommunityPostPollRepository pollRepository,

        CommunityPostPollOptionRepository pollOptionRepository,

        CommunityPostPollVoteRepository pollVoteRepository,

        UserProfileRepository userProfileRepository,

        ContentModerationScanner moderationScanner,

        CommunityPostFileStorageService fileStorageService,

        UserStreakService userStreakService

    ) {

        this.postRepository = postRepository;

        this.likeRepository = likeRepository;

        this.commentRepository = commentRepository;

        this.savedRepository = savedRepository;

        this.pollRepository = pollRepository;

        this.pollOptionRepository = pollOptionRepository;

        this.pollVoteRepository = pollVoteRepository;

        this.userProfileRepository = userProfileRepository;

        this.moderationScanner = moderationScanner;

        this.fileStorageService = fileStorageService;

        this.userStreakService = userStreakService;

    }



    @Transactional(readOnly = true)

    public List<CommunityPostResponse> listFeed(
        UUID viewerId,
        String category,
        String query,
        String tag,
        String sort,
        int limit
    ) {

        int safeLimit = Math.min(Math.max(limit, 1), 100);

        PageRequest page = PageRequest.of(0, safeLimit);

        List<CommunityPost> posts;

        if (query != null && !query.isBlank()) {

            posts = postRepository.findByContentContainingIgnoreCase(query.trim(), page);

        } else if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {

            posts = postRepository.findAllByOrderByCreatedAtDesc(page);

        } else {

            posts = postRepository.findAllByCategoryOrderByCreatedAtDesc(normalizeCategory(category), page);

        }



        String normalizedTag = tag != null && !tag.isBlank() ? tag.trim().toLowerCase(Locale.ROOT) : null;



        List<CommunityPostResponse> responses = posts.stream()

            .filter(post -> !post.isRemoved())

            .filter(post -> normalizedTag == null || post.getTags().contains(normalizedTag))

            .map(post -> toPostResponse(post, viewerId))

            .collect(Collectors.toCollection(ArrayList::new));



        if (sort != null && "popular".equalsIgnoreCase(sort.trim())) {

            responses.sort((a, b) -> Long.compare(

                b.likeCount() + b.commentCount(),

                a.likeCount() + a.commentCount()

            ));

        } else {

            responses.sort((a, b) -> b.createdAt().compareTo(a.createdAt()));

        }



        return responses;

    }



    @Transactional(readOnly = true)

    public CommunityFeedStatsResponse getStats() {

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        long totalPosts = postRepository.count();

        long activeDevelopers = postRepository.countDistinctAuthorsSince(thirtyDaysAgo);

        long recentPosts = postRepository.countByCreatedAtAfter(thirtyDaysAgo);

        List<TrendingTagResponse> trendingTags = computeTrendingTags();

        return new CommunityFeedStatsResponse(

            totalPosts,

            activeDevelopers,

            recentPosts,

            trendingTags.size(),

            trendingTags

        );

    }



    @Transactional

    public CommunityPostUploadResponse uploadFile(UUID uploaderId, MultipartFile file, String kind) {

        return fileStorageService.store(uploaderId, file, kind);

    }



    @Transactional

    public CommunityPost adminRemovePost(UUID postId) {

        CommunityPost post = findPost(postId);

        post.setRemoved(true);

        post.setModerationStatus("removed");

        return postRepository.save(post);

    }



    @Transactional(readOnly = true)

    public Optional<CommunityPost> findPostById(UUID postId) {

        return postId != null ? postRepository.findById(postId) : Optional.empty();

    }



    @Transactional(readOnly = true)

    public Optional<CommunityPost> findPostByContentHint(String hint) {

        if (hint == null || hint.isBlank()) {

            return Optional.empty();

        }

        String trimmed = hint.trim();

        Optional<CommunityPost> exactMatch = postRepository.findFirstByContentIgnoreCase(trimmed);

        if (exactMatch.isPresent()) {

            return exactMatch;

        }

        List<CommunityPost> partialMatches =

            postRepository.findByContentContainingIgnoreCase(trimmed, PageRequest.of(0, 1));

        return partialMatches.isEmpty() ? Optional.empty() : Optional.of(partialMatches.get(0));

    }



    @Transactional

    public CommunityPostResponse createPost(UUID authorId, String username, CreateCommunityPostRequest request) {

        userProfileRepository.findById(authorId).orElseGet(() -> {

            UserProfile created = new UserProfile();

            created.setId(authorId);

            created.setUsername(username);

            return userProfileRepository.save(created);

        });



        validateCreateRequest(request);



        String content = request.content() != null ? request.content().trim() : "";

        if (content.isBlank() && request.poll() != null) {

            content = request.poll().question().trim();

        }



        CommunityPost post = new CommunityPost();

        post.setAuthorId(authorId);

        post.setContent(content);

        post.setCategory(normalizeCategory(request.category()));

        if (request.tags() != null) {

            post.setTags(normalizeTags(request.tags()));

        }



        applyImageFields(post, request, authorId);

        applyAttachmentFields(post, request, authorId);

        applyCodeFields(post, request);



        moderationScanner.applyScanResult(post, moderationScanner.scan(post.getContent()));

        CommunityPost saved = postRepository.save(post);

        userStreakService.recordActivity(authorId);



        if (request.poll() != null) {

            createPoll(saved.getId(), request.poll());

        }



        return toPostResponse(saved, authorId);

    }



    @Transactional

    public CommunityPostResponse votePoll(UUID postId, UUID userId, UUID optionId) {

        CommunityPost post = findPost(postId);

        CommunityPostPoll poll = pollRepository.findByPostId(postId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "This post has no poll"));



        if (pollVoteRepository.existsByPollIdAndUserId(poll.getId(), userId)) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already voted on this poll");

        }



        CommunityPostPollOption option = pollOptionRepository.findById(optionId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll option not found"));

        if (!option.getPollId().equals(poll.getId())) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Option does not belong to this poll");

        }



        CommunityPostPollVote vote = new CommunityPostPollVote();

        vote.setPollId(poll.getId());

        vote.setOptionId(optionId);

        vote.setUserId(userId);

        pollVoteRepository.save(vote);



        option.setVoteCount(option.getVoteCount() + 1);

        pollOptionRepository.save(option);



        return toPostResponse(post, userId);

    }



    @Transactional

    public CommunityPostResponse likePost(UUID postId, UUID userId) {

        CommunityPost post = findPost(postId);

        if (!likeRepository.existsByPostIdAndUserId(postId, userId)) {

            CommunityPostLike like = new CommunityPostLike();

            like.setPostId(postId);

            like.setUserId(userId);

            likeRepository.save(like);

        }

        return toPostResponse(post, userId);

    }



    @Transactional

    public CommunityPostResponse unlikePost(UUID postId, UUID userId) {

        CommunityPost post = findPost(postId);

        likeRepository.deleteByPostIdAndUserId(postId, userId);

        return toPostResponse(post, userId);

    }



    @Transactional

    public CommunityPostResponse savePost(UUID postId, UUID userId) {

        CommunityPost post = findPost(postId);

        if (!savedRepository.existsByPostIdAndUserId(postId, userId)) {

            CommunityPostSaved saved = new CommunityPostSaved();

            saved.setPostId(postId);

            saved.setUserId(userId);

            savedRepository.save(saved);

        }

        return toPostResponse(post, userId);

    }



    @Transactional

    public CommunityPostResponse unsavePost(UUID postId, UUID userId) {

        CommunityPost post = findPost(postId);

        savedRepository.deleteByPostIdAndUserId(postId, userId);

        return toPostResponse(post, userId);

    }



    @Transactional(readOnly = true)

    public List<CommunityCommentResponse> listComments(UUID postId) {

        findPost(postId);

        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()

            .map(this::toCommentResponse)

            .toList();

    }



    @Transactional

    public CommunityCommentResponse addComment(UUID postId, UUID authorId, CreateCommunityCommentRequest request) {

        findPost(postId);

        if (request.parentCommentId() != null) {

            CommunityPostComment parent = commentRepository.findById(request.parentCommentId())

                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment not found"));

            if (!parent.getPostId().equals(postId)) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment does not belong to this post");

            }

        }

        CommunityPostComment comment = new CommunityPostComment();

        comment.setPostId(postId);

        comment.setAuthorId(authorId);

        comment.setContent(request.content().trim());

        comment.setParentCommentId(request.parentCommentId());

        CommunityPostComment saved = commentRepository.save(comment);

        userStreakService.recordActivity(authorId);

        return toCommentResponse(saved);

    }



    @Transactional

    public void deleteComment(UUID postId, UUID commentId, UUID userId) {

        CommunityPostComment comment = commentRepository.findById(commentId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getPostId().equals(postId)) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment does not belong to this post");

        }

        if (!comment.getAuthorId().equals(userId)) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own comments");

        }

        commentRepository.delete(comment);

    }



    private void validateCreateRequest(CreateCommunityPostRequest request) {

        boolean hasText = request.content() != null && !request.content().isBlank();

        boolean hasImage = request.imageFileId() != null || (request.imageUrl() != null && !request.imageUrl().isBlank());

        boolean hasAttachment = request.attachmentFileId() != null

            || (request.attachmentUrl() != null && !request.attachmentUrl().isBlank());

        boolean hasCode = request.code() != null

            && request.code().content() != null

            && !request.code().content().isBlank();

        boolean hasPoll = request.poll() != null;



        if (!hasText && !hasImage && !hasAttachment && !hasCode && !hasPoll) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post must include text, image, attachment, code, or poll");

        }



        if (hasCode) {

            int lines = request.code().content().split("\n", -1).length;

            if (lines > MAX_CODE_LINES) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code snippet must be 500 lines or fewer");

            }

        }



        if (hasPoll) {

            List<String> options = request.poll().options().stream()

                .map(String::trim)

                .filter(s -> !s.isEmpty())

                .toList();

            if (options.size() < 2) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please add at least two poll options");

            }

            if (options.size() > 5) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Poll supports at most five options");

            }

        }

    }



    private void applyImageFields(CommunityPost post, CreateCommunityPostRequest request, UUID authorId) {

        if (request.imageFileId() != null) {

            CommunityPostFile file = fileStorageService.findFile(request.imageFileId());

            if (!file.getUploaderId().equals(authorId)) {

                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Image file does not belong to you");

            }

            if (!"IMAGE".equals(file.getFileKind())) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file");

            }

            post.setImageFileId(file.getId());

            post.setImageUrl(fileStorageService.publicUrlFor(file));

            return;

        }

        if (request.imageUrl() != null && !request.imageUrl().isBlank()) {

            post.setImageUrl(request.imageUrl().trim());

        }

    }



    private void applyAttachmentFields(CommunityPost post, CreateCommunityPostRequest request, UUID authorId) {

        if (request.attachmentFileId() != null) {

            CommunityPostFile file = fileStorageService.findFile(request.attachmentFileId());

            if (!file.getUploaderId().equals(authorId)) {

                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachment file does not belong to you");

            }

            if (!"ATTACHMENT".equals(file.getFileKind())) {

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment file");

            }

            post.setAttachmentFileId(file.getId());

            post.setAttachmentName(file.getOriginalName());

            post.setAttachmentSize(file.getSizeBytes());

            post.setAttachmentType(file.getMimeType());

            post.setAttachmentUrl(fileStorageService.downloadUrlFor(file.getId()));

            return;

        }

        if (request.attachmentUrl() != null && !request.attachmentUrl().isBlank()) {

            post.setAttachmentUrl(request.attachmentUrl().trim());

            post.setAttachmentName(request.attachmentName());

            post.setAttachmentSize(request.attachmentSize());

            post.setAttachmentType(request.attachmentType());

        }

    }



    private void applyCodeFields(CommunityPost post, CreateCommunityPostRequest request) {

        if (request.code() == null || request.code().content() == null || request.code().content().isBlank()) {

            return;

        }

        post.setCodeLanguage(request.code().language().trim().toLowerCase(Locale.ROOT));

        post.setCodeContent(request.code().content());

    }



    private void createPoll(UUID postId, CommunityPostPollCreateRequest pollRequest) {

        CommunityPostPoll poll = new CommunityPostPoll();

        poll.setPostId(postId);

        poll.setQuestion(pollRequest.question().trim());

        CommunityPostPoll savedPoll = pollRepository.save(poll);



        List<String> options = pollRequest.options().stream()

            .map(String::trim)

            .filter(s -> !s.isEmpty())

            .limit(5)

            .toList();



        for (int i = 0; i < options.size(); i++) {

            CommunityPostPollOption option = new CommunityPostPollOption();

            option.setPollId(savedPoll.getId());

            option.setOptionText(options.get(i));

            option.setVoteCount(0);

            option.setSortOrder(i);

            pollOptionRepository.save(option);

        }

    }



    private CommunityPost findPost(UUID postId) {

        return postRepository.findById(postId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    }



    private CommunityPostResponse toPostResponse(CommunityPost post, UUID viewerId) {

        UserProfile author = userProfileRepository.findById(post.getAuthorId()).orElse(null);

        String displayName = author != null && author.getDisplayName() != null

            ? author.getDisplayName()

            : author != null ? author.getUsername() : "Developer";

        String role = author != null ? author.getRole() : null;

        long likeCount = likeRepository.countByPostId(post.getId());

        long commentCount = commentRepository.countByPostId(post.getId());

        boolean likedByMe = likeRepository.existsByPostIdAndUserId(post.getId(), viewerId);

        boolean savedByMe = savedRepository.existsByPostIdAndUserId(post.getId(), viewerId);



        CommunityPostAttachmentResponse attachment = null;

        if (post.getAttachmentUrl() != null && !post.getAttachmentUrl().isBlank()) {

            attachment = new CommunityPostAttachmentResponse(

                post.getAttachmentName() != null ? post.getAttachmentName() : "Attachment",

                post.getAttachmentUrl(),

                post.getAttachmentSize() != null ? post.getAttachmentSize() : 0L,

                post.getAttachmentType() != null ? post.getAttachmentType() : "application/octet-stream",

                post.getAttachmentFileId()

            );

        }



        CommunityPostCodeResponse code = null;

        if (post.getCodeContent() != null && !post.getCodeContent().isBlank()) {

            code = new CommunityPostCodeResponse(

                post.getCodeLanguage() != null ? post.getCodeLanguage() : "text",

                post.getCodeContent()

            );

        }



        CommunityPostPollResponse poll = buildPollResponse(post.getId(), viewerId);



        return new CommunityPostResponse(

            post.getId(),

            post.getAuthorId(),

            displayName,

            role,

            post.getContent(),

            post.getCategory(),

            Set.copyOf(post.getTags()),

            likeCount,

            commentCount,

            likedByMe,

            savedByMe,

            post.getCreatedAt(),

            post.getImageUrl(),

            attachment,

            code,

            poll

        );

    }



    private CommunityPostPollResponse buildPollResponse(UUID postId, UUID viewerId) {

        return pollRepository.findByPostId(postId)

            .map(poll -> {

                List<CommunityPostPollOption> options =

                    pollOptionRepository.findByPollIdOrderBySortOrderAsc(poll.getId());

                long totalVotes = options.stream().mapToLong(CommunityPostPollOption::getVoteCount).sum();

                UUID votedOptionId = pollVoteRepository.findByPollIdAndUserId(poll.getId(), viewerId)

                    .map(CommunityPostPollVote::getOptionId)

                    .orElse(null);



                List<CommunityPostPollOptionResponse> optionResponses = options.stream()

                    .map(option -> {

                        int percentage = totalVotes == 0

                            ? 0

                            : (int) Math.round((option.getVoteCount() * 100.0) / totalVotes);

                        return new CommunityPostPollOptionResponse(

                            option.getId(),

                            option.getOptionText(),

                            option.getVoteCount(),

                            percentage

                        );

                    })

                    .toList();



                return new CommunityPostPollResponse(

                    poll.getId(),

                    poll.getQuestion(),

                    totalVotes,

                    votedOptionId,

                    optionResponses

                );

            })

            .orElse(null);

    }



    private CommunityCommentResponse toCommentResponse(CommunityPostComment comment) {

        UserProfile author = userProfileRepository.findById(comment.getAuthorId()).orElse(null);

        String displayName = author != null && author.getDisplayName() != null

            ? author.getDisplayName()

            : author != null ? author.getUsername() : "Developer";

        return new CommunityCommentResponse(

            comment.getId(),

            comment.getAuthorId(),

            displayName,

            comment.getContent(),

            comment.getParentCommentId(),

            comment.getCreatedAt()

        );

    }



    private List<TrendingTagResponse> computeTrendingTags() {

        Map<String, Long> counts = new HashMap<>();

        postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 200)).stream()

            .filter(post -> !post.isRemoved())

            .forEach(post -> post.getTags().forEach(tag -> counts.merge(tag, 1L, Long::sum)));

        return counts.entrySet().stream()

            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))

            .limit(8)

            .map(entry -> new TrendingTagResponse(entry.getKey(), entry.getValue()))

            .toList();

    }



    private String normalizeCategory(String category) {

        if (category == null || category.isBlank()) {

            return "general";

        }

        return category.trim().toLowerCase(Locale.ROOT);

    }



    private Set<String> normalizeTags(Set<String> tags) {

        return tags.stream()

            .map(tag -> tag.trim().toLowerCase(Locale.ROOT).replace("#", ""))

            .filter(tag -> !tag.isEmpty())

            .collect(Collectors.toCollection(LinkedHashSet::new));

    }

}

