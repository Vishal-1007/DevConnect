package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostLike;
import com.developersconnect.user.model.CommunityPostLike.PostLikeId;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, PostLikeId> {

    long countByPostId(UUID postId);

    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    void deleteByPostIdAndUserId(UUID postId, UUID userId);

    @Query("""
        SELECT COUNT(l) FROM CommunityPostLike l
        JOIN CommunityPost p ON l.postId = p.id
        WHERE p.authorId = :authorId AND l.createdAt >= :after
        """)
    long countLikesReceivedSince(@Param("authorId") UUID authorId, @Param("after") Instant after);

    @Query("""
        SELECT COUNT(l) FROM CommunityPostLike l
        JOIN CommunityPost p ON l.postId = p.id
        WHERE p.authorId = :authorId
        """)
    long countLikesReceived(@Param("authorId") UUID authorId);
}
