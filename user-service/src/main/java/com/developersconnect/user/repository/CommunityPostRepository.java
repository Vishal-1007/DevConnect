package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPost;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {

    List<CommunityPost> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<CommunityPost> findAllByCategoryOrderByCreatedAtDesc(String category, Pageable pageable);

    long countByAuthorId(UUID authorId);

    long countByAuthorIdAndCreatedAtAfter(UUID authorId, Instant after);

    java.util.Optional<CommunityPost> findFirstByContentIgnoreCase(String content);

    java.util.List<CommunityPost> findByContentContainingIgnoreCase(String fragment, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("""
        SELECT COUNT(DISTINCT p.authorId) FROM CommunityPost p
        WHERE p.createdAt >= :since AND p.removed = false
        """)
    long countDistinctAuthorsSince(@org.springframework.data.repository.query.Param("since") Instant since);

    long countByCreatedAtAfter(Instant after);

    @Query("""
        SELECT p.createdAt FROM CommunityPost p
        WHERE p.authorId = :userId AND p.removed = false AND p.createdAt >= :since
        """)
    List<Instant> findActivityTimestampsByAuthorSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
