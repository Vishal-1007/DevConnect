package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostComment;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostCommentRepository extends JpaRepository<CommunityPostComment, UUID> {

    long countByPostId(UUID postId);

    List<CommunityPostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);

    long countByAuthorIdAndCreatedAtAfter(UUID authorId, Instant after);

    @Query("""
        SELECT c.createdAt FROM CommunityPostComment c
        WHERE c.authorId = :userId AND c.createdAt >= :since
        """)
    List<Instant> findActivityTimestampsByAuthorSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
