package com.developersconnect.user.service;

import com.developersconnect.user.dto.CreateDiscussionReplyRequest;
import com.developersconnect.user.dto.CreateDiscussionThreadRequest;
import com.developersconnect.user.dto.DiscussionReplyResponse;
import com.developersconnect.user.dto.DiscussionThreadResponse;
import com.developersconnect.user.model.DiscussionReply;
import com.developersconnect.user.model.DiscussionThread;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.DiscussionReplyRepository;
import com.developersconnect.user.repository.DiscussionThreadRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DiscussionService {

    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserStreakService userStreakService;

    public DiscussionService(
        DiscussionThreadRepository threadRepository,
        DiscussionReplyRepository replyRepository,
        UserProfileRepository userProfileRepository,
        UserStreakService userStreakService
    ) {
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.userProfileRepository = userProfileRepository;
        this.userStreakService = userStreakService;
    }

    @Transactional(readOnly = true)
    public List<DiscussionThreadResponse> listThreads(String topic, String query, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        PageRequest page = PageRequest.of(0, safeLimit);
        List<DiscussionThread> threads;
        if (query != null && !query.isBlank()) {
            threads = threadRepository.searchActive(query.trim(), page);
        } else if (topic == null || topic.isBlank() || "all".equalsIgnoreCase(topic)) {
            threads = threadRepository.findAllByRemovedFalseOrderByPinnedDescPinnedOrderAscCreatedAtDesc(page);
        } else {
            threads = threadRepository.findAllByTopicAndRemovedFalseOrderByPinnedDescPinnedOrderAscCreatedAtDesc(
                normalizeTopic(topic),
                page
            );
        }
        return threads.stream().map(this::toThreadResponse).toList();
    }

    @Transactional(readOnly = true)
    public DiscussionThreadResponse getThread(UUID threadId) {
        return toThreadResponse(findThread(threadId));
    }

    @Transactional
    public DiscussionThreadResponse createThread(UUID authorId, String username, CreateDiscussionThreadRequest request) {
        ensureProfile(authorId, username);
        DiscussionThread thread = new DiscussionThread();
        thread.setAuthorId(authorId);
        thread.setTitle(request.title().trim());
        thread.setContent(request.content().trim());
        thread.setTopic(normalizeTopic(request.topic()));
        if (request.tags() != null) {
            thread.setTags(normalizeTags(request.tags()));
        }
        DiscussionThread saved = threadRepository.save(thread);
        userStreakService.recordActivity(authorId);
        return toThreadResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DiscussionReplyResponse> listReplies(UUID threadId) {
        findThread(threadId);
        return replyRepository.findByThreadIdOrderByCreatedAtAsc(threadId).stream()
            .map(this::toReplyResponse)
            .toList();
    }

    @Transactional
    public DiscussionReplyResponse addReply(UUID threadId, UUID authorId, CreateDiscussionReplyRequest request) {
        findThread(threadId);
        DiscussionReply reply = new DiscussionReply();
        reply.setThreadId(threadId);
        reply.setAuthorId(authorId);
        reply.setContent(request.content().trim());
        DiscussionReply saved = replyRepository.save(reply);
        userStreakService.recordActivity(authorId);
        return toReplyResponse(saved);
    }

    @Transactional
    public DiscussionThreadResponse markSolved(UUID threadId, UUID userId, UUID replyId) {
        DiscussionThread thread = findThread(threadId);
        if (!thread.getAuthorId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the thread author can mark as solved");
        }
        DiscussionReply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply not found"));
        if (!reply.getThreadId().equals(threadId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply does not belong to this thread");
        }
        replyRepository.findByThreadIdOrderByCreatedAtAsc(threadId).forEach(r -> {
            r.setAcceptedAnswer(r.getId().equals(replyId));
            replyRepository.save(r);
        });
        thread.setSolved(true);
        return toThreadResponse(threadRepository.save(thread));
    }

    private DiscussionThread findThread(UUID threadId) {
        DiscussionThread thread = threadRepository.findById(threadId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion not found"));
        if (thread.isRemoved()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion not found");
        }
        return thread;
    }

    private void ensureProfile(UUID authorId, String username) {
        userProfileRepository.findById(authorId).orElseGet(() -> {
            UserProfile created = new UserProfile();
            created.setId(authorId);
            created.setUsername(username);
            return userProfileRepository.save(created);
        });
    }

    private DiscussionThreadResponse toThreadResponse(DiscussionThread thread) {
        UserProfile author = userProfileRepository.findById(thread.getAuthorId()).orElse(null);
        String displayName = resolveDisplayName(author);
        String role = author != null ? author.getRole() : null;
        long replyCount = replyRepository.countByThreadId(thread.getId());
        return new DiscussionThreadResponse(
            thread.getId(),
            thread.getAuthorId(),
            displayName,
            role,
            thread.getTitle(),
            thread.getContent(),
            thread.getTopic(),
            Set.copyOf(thread.getTags()),
            thread.isSolved(),
            thread.isPinned(),
            replyCount,
            thread.getCreatedAt(),
            thread.getUpdatedAt()
        );
    }

    private DiscussionReplyResponse toReplyResponse(DiscussionReply reply) {
        UserProfile author = userProfileRepository.findById(reply.getAuthorId()).orElse(null);
        return new DiscussionReplyResponse(
            reply.getId(),
            reply.getThreadId(),
            reply.getAuthorId(),
            resolveDisplayName(author),
            reply.getContent(),
            reply.isAcceptedAnswer(),
            reply.getCreatedAt()
        );
    }

    private String resolveDisplayName(UserProfile author) {
        if (author == null) {
            return "Developer";
        }
        if (author.getDisplayName() != null) {
            return author.getDisplayName();
        }
        return author.getUsername();
    }

    private String normalizeTopic(String topic) {
        if (topic == null || topic.isBlank()) {
            return "general";
        }
        return topic.trim().toLowerCase(Locale.ROOT);
    }

    private Set<String> normalizeTags(Set<String> tags) {
        return tags.stream()
            .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
            .filter(tag -> !tag.isEmpty())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
