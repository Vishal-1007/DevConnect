package com.developersconnect.user.repository;

import com.developersconnect.user.model.DiscussionReply;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, UUID> {

    long countByThreadId(UUID threadId);

    List<DiscussionReply> findByThreadIdOrderByCreatedAtAsc(UUID threadId);

    List<DiscussionReply> findByThreadIdAndAcceptedAnswerTrue(UUID threadId);

    long countByAuthorId(UUID authorId);

    long countByAuthorIdAndCreatedAtAfter(UUID authorId, Instant after);

    @Query("""
        SELECT r.createdAt FROM DiscussionReply r
        WHERE r.authorId = :userId AND r.createdAt >= :since
        """)
    List<Instant> findActivityTimestampsByAuthorSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
