package com.developersconnect.user.repository;

import com.developersconnect.user.model.VideoRoomParticipant;
import com.developersconnect.user.model.VideoRoomParticipant.ParticipantId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRoomParticipantRepository extends JpaRepository<VideoRoomParticipant, ParticipantId> {

    long countByRoomIdAndLeftAtIsNull(UUID roomId);

    @Query("""
        SELECT COUNT(p) FROM VideoRoomParticipant p
        WHERE p.roomId = :roomId AND p.status = :status AND p.leftAt IS NULL
        """)
    long countActiveByRoomAndStatus(@Param("roomId") UUID roomId, @Param("status") String status);

    boolean existsByRoomIdAndUserIdAndLeftAtIsNull(UUID roomId, UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(p) > 0 THEN TRUE ELSE FALSE END
        FROM VideoRoomParticipant p
        WHERE p.roomId = :roomId AND p.userId = :userId AND p.status = :status AND p.leftAt IS NULL
        """)
    boolean existsActiveByRoomUserAndStatus(
        @Param("roomId") UUID roomId,
        @Param("userId") UUID userId,
        @Param("status") String status
    );

    @Query("""
        SELECT p FROM VideoRoomParticipant p
        WHERE p.roomId = :roomId AND p.leftAt IS NULL
        ORDER BY p.joinedAt ASC
        """)
    List<VideoRoomParticipant> findPresentByRoomOrderByJoinedAt(@Param("roomId") UUID roomId);

    @Query("""
        SELECT p FROM VideoRoomParticipant p
        WHERE p.roomId = :roomId AND p.status = :status AND p.leftAt IS NULL
        ORDER BY p.joinedAt ASC
        """)
    List<VideoRoomParticipant> findActiveByRoomAndStatusOrderByJoinedAt(
        @Param("roomId") UUID roomId,
        @Param("status") String status
    );

    List<VideoRoomParticipant> findAllByRoomIdOrderByJoinedAtAsc(UUID roomId);

    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);

    void deleteAllByRoomId(UUID roomId);

    @Query("""
        SELECT p.joinedAt FROM VideoRoomParticipant p
        WHERE p.userId = :userId AND p.joinedAt >= :since
        """)
    List<Instant> findActivityTimestampsByUserSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
