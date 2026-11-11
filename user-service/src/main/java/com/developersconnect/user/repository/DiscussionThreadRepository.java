package com.developersconnect.user.repository;

import com.developersconnect.user.model.DiscussionThread;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiscussionThreadRepository extends JpaRepository<DiscussionThread, UUID> {

    List<DiscussionThread> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<DiscussionThread> findAllByRemovedFalseOrderByPinnedDescPinnedOrderAscCreatedAtDesc(Pageable pageable);

    List<DiscussionThread> findAllByTopicAndRemovedFalseOrderByPinnedDescPinnedOrderAscCreatedAtDesc(
        String topic,
        Pageable pageable
    );

    List<DiscussionThread> findAllByOrderByPinnedDescPinnedOrderAscCreatedAtDesc(Pageable pageable);

    long countByRemovedFalse();

    long countByRemovedTrue();

    long countByPinnedTrueAndRemovedFalse();

    long countBySolvedTrueAndRemovedFalse();

    List<DiscussionThread> findAllByTopicOrderByCreatedAtDesc(String topic, Pageable pageable);

    long countByAuthorId(UUID authorId);

    long countByAuthorIdAndCreatedAtAfter(UUID authorId, Instant after);

    long countByAuthorIdAndSolvedTrue(UUID authorId);

    @Query("""
        SELECT t FROM DiscussionThread t
        WHERE t.removed = false
          AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(t.content) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY t.pinned DESC, t.pinnedOrder ASC, t.createdAt DESC
        """)
    List<DiscussionThread> searchActive(@Param("query") String query, Pageable pageable);

    @Query("""
        SELECT t FROM DiscussionThread t
        WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(t.content) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY t.pinned DESC, t.pinnedOrder ASC, t.createdAt DESC
        """)
    List<DiscussionThread> search(@Param("query") String query, Pageable pageable);

    @Query("""
        SELECT t.createdAt FROM DiscussionThread t
        WHERE t.authorId = :userId AND t.removed = false AND t.createdAt >= :since
        """)
    List<Instant> findActivityTimestampsByAuthorSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
