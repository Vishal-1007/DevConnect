package com.developersconnect.user.repository;

import com.developersconnect.user.model.VideoRoom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRoomRepository extends JpaRepository<VideoRoom, UUID> {

    List<VideoRoom> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<VideoRoom> findAllByCategoryAndStatusOrderByCreatedAtDesc(
        String category, String status, Pageable pageable
    );

    @Query("""
        SELECT r FROM VideoRoom r
        WHERE r.status = :status
          AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(r.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY r.createdAt DESC
        """)
    List<VideoRoom> searchByStatus(
        @Param("query") String query,
        @Param("status") String status,
        Pageable pageable
    );

    List<VideoRoom> findAllByStatusAndRoomTypeOrderByCreatedAtDesc(
        String status, String roomType, Pageable pageable
    );

    List<VideoRoom> findAllByParentRoomIdAndStatusOrderByCreatedAtAsc(UUID parentRoomId, String status);

    List<VideoRoom> findAllByParentRoomIdIsNullAndStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<VideoRoom> findAllByParentRoomIdIsNullOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(Pageable pageable);

    List<VideoRoom> findAllByParentRoomIdIsNullAndStatusOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
        String status, Pageable pageable
    );

    List<VideoRoom> findAllByParentRoomIdIsNullAndUseCaseOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
        String useCase, Pageable pageable
    );

    List<VideoRoom> findAllByParentRoomIdIsNullAndUseCaseAndStatusOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
        String useCase, String status, Pageable pageable
    );

    List<VideoRoom> findAllByFeaturedTrueAndParentRoomIdIsNullAndStatusOrderByFeaturedOrderAscCreatedAtDesc(
        String status, Pageable pageable
    );

    Optional<VideoRoom> findFirstByTitleIgnoreCase(String title);

    long countByParentRoomIdIsNullAndStatus(String status);

    long countByParentRoomIdIsNullAndFeaturedTrue();

    long countByParentRoomIdIsNull();

    Optional<VideoRoom> findByRoomCode(String roomCode);

    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM VideoRoom r
        WHERE r.hostId = :hostId
          AND r.parentRoomId IS NULL
          AND r.premiumRoom = false
          AND r.createdAt >= :since
        """)
    boolean existsFreeHostRoomSince(@Param("hostId") UUID hostId, @Param("since") Instant since);

    Optional<VideoRoom> findFirstByHostIdAndParentRoomIdIsNullAndPremiumRoomFalseAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
        UUID hostId,
        Instant since
    );

    Optional<VideoRoom> findFirstByHostIdAndStatusAndParentRoomIdIsNullAndPremiumRoomFalseOrderByCreatedAtDesc(
        UUID hostId,
        String status
    );

    @Query("""
        SELECT r FROM VideoRoom r
        WHERE r.status = 'live'
          AND r.premiumRoom = false
          AND r.expiresAt IS NOT NULL
          AND r.expiresAt < :now
        """)
    List<VideoRoom> findFreeRoomsPastExpiry(@Param("now") Instant now, Pageable pageable);
}
