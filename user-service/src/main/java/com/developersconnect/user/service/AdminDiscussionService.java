package com.developersconnect.user.service;

import com.developersconnect.user.dto.AdminDiscussionThreadResponse;
import com.developersconnect.user.dto.DiscussionAnalyticsResponse;
import com.developersconnect.user.dto.UpdateAdminDiscussionRequest;
import com.developersconnect.user.model.DiscussionThread;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.DiscussionReplyRepository;
import com.developersconnect.user.repository.DiscussionThreadRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.util.Comparator;
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
public class AdminDiscussionService {

    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserProfileRepository userProfileRepository;

    public AdminDiscussionService(
        DiscussionThreadRepository threadRepository,
        DiscussionReplyRepository replyRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.threadRepository = threadRepository;
        this.replyRepository = replyRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminDiscussionThreadResponse> listThreads(String status, String topic, String q, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        PageRequest page = PageRequest.of(0, safeLimit);
        List<DiscussionThread> threads = resolveThreadList(status, topic, q, page);
        return threads.stream().map(this::toAdminResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminDiscussionThreadResponse getThread(UUID threadId) {
        return toAdminResponse(findThread(threadId));
    }

    @Transactional(readOnly = true)
    public DiscussionAnalyticsResponse getAnalytics() {
        long active = threadRepository.countByRemovedFalse();
        long removed = threadRepository.countByRemovedTrue();
        return new DiscussionAnalyticsResponse(
            active + removed,
            active,
            threadRepository.countByPinnedTrueAndRemovedFalse(),
            removed,
            threadRepository.countBySolvedTrueAndRemovedFalse()
        );
    }

    @Transactional
    public AdminDiscussionThreadResponse updateThread(UUID threadId, UpdateAdminDiscussionRequest request) {
        DiscussionThread thread = findThread(threadId);
        if (request.pinned() != null) {
            thread.setPinned(request.pinned());
            if (!request.pinned()) {
                thread.setPinnedOrder(0);
            }
        }
        if (request.pinnedOrder() != null) {
            thread.setPinnedOrder(Math.max(0, request.pinnedOrder()));
            if (thread.getPinnedOrder() > 0) {
                thread.setPinned(true);
            }
        }
        if (request.removed() != null) {
            thread.setRemoved(request.removed());
            if (request.removed()) {
                thread.setPinned(false);
                thread.setPinnedOrder(0);
            }
        }
        return toAdminResponse(threadRepository.save(thread));
    }

    @Transactional
    public AdminDiscussionThreadResponse removeThread(UUID threadId) {
        return updateThread(threadId, new UpdateAdminDiscussionRequest(null, null, true));
    }

    @Transactional
    public AdminDiscussionThreadResponse restoreThread(UUID threadId) {
        return updateThread(threadId, new UpdateAdminDiscussionRequest(null, null, false));
    }

    @Transactional
    public AdminDiscussionThreadResponse togglePin(UUID threadId) {
        DiscussionThread thread = findThread(threadId);
        if (thread.isRemoved()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Removed discussions cannot be pinned");
        }
        boolean nextPinned = !thread.isPinned();
        thread.setPinned(nextPinned);
        if (nextPinned && thread.getPinnedOrder() == 0) {
            thread.setPinnedOrder(nextPinnedOrder());
        }
        if (!nextPinned) {
            thread.setPinnedOrder(0);
        }
        return toAdminResponse(threadRepository.save(thread));
    }

    private List<DiscussionThread> resolveThreadList(String status, String topic, String q, PageRequest page) {
        String normalizedStatus = status == null || status.isBlank() ? "active" : status.trim().toLowerCase(Locale.ROOT);
        String normalizedTopic = topic != null && !topic.isBlank() && !"all".equalsIgnoreCase(topic)
            ? topic.trim().toLowerCase(Locale.ROOT)
            : null;
        String query = q != null && !q.isBlank() ? q.trim() : null;

        List<DiscussionThread> threads;
        if (query != null) {
            threads = "active".equals(normalizedStatus)
                ? threadRepository.searchActive(query, page)
                : threadRepository.search(query, page);
        } else if (normalizedTopic != null) {
            threads = threadRepository.findAllByTopicOrderByCreatedAtDesc(normalizedTopic, page);
        } else {
            threads = "all".equals(normalizedStatus)
                ? threadRepository.findAllByOrderByPinnedDescPinnedOrderAscCreatedAtDesc(page)
                : threadRepository.findAllByOrderByCreatedAtDesc(page);
        }

        return threads.stream()
            .filter(thread -> matchesStatus(thread, normalizedStatus))
            .filter(thread -> normalizedTopic == null || normalizedTopic.equals(thread.getTopic()))
            .sorted(threadComparator())
            .toList();
    }

    private boolean matchesStatus(DiscussionThread thread, String status) {
        return switch (status) {
            case "all" -> true;
            case "removed" -> thread.isRemoved();
            case "pinned" -> thread.isPinned() && !thread.isRemoved();
            default -> !thread.isRemoved();
        };
    }

    private Comparator<DiscussionThread> threadComparator() {
        return Comparator
            .comparing(DiscussionThread::isPinned).reversed()
            .thenComparing(DiscussionThread::getPinnedOrder)
            .thenComparing(DiscussionThread::getCreatedAt, Comparator.reverseOrder());
    }

    private int nextPinnedOrder() {
        return threadRepository.findAllByOrderByPinnedDescPinnedOrderAscCreatedAtDesc(PageRequest.of(0, 200))
            .stream()
            .filter(thread -> thread.isPinned() && !thread.isRemoved())
            .mapToInt(DiscussionThread::getPinnedOrder)
            .max()
            .orElse(0) + 1;
    }

    private DiscussionThread findThread(UUID threadId) {
        return threadRepository.findById(threadId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Discussion not found"));
    }

    private AdminDiscussionThreadResponse toAdminResponse(DiscussionThread thread) {
        UserProfile author = userProfileRepository.findById(thread.getAuthorId()).orElse(null);
        long replyCount = replyRepository.countByThreadId(thread.getId());
        return new AdminDiscussionThreadResponse(
            thread.getId(),
            thread.getAuthorId(),
            resolveDisplayName(author),
            author != null ? author.getRole() : null,
            thread.getTitle(),
            thread.getContent(),
            thread.getTopic(),
            Set.copyOf(thread.getTags()),
            thread.isSolved(),
            thread.isPinned(),
            thread.getPinnedOrder(),
            thread.isRemoved(),
            replyCount,
            thread.getCreatedAt(),
            thread.getUpdatedAt()
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
}
