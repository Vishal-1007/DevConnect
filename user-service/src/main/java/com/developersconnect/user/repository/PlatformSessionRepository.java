package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformSession;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformSessionRepository extends JpaRepository<PlatformSession, UUID> {

    Optional<PlatformSession> findByLinkedRoomId(UUID linkedRoomId);

    Optional<PlatformSession> findByLinkedMatchRequestId(UUID linkedMatchRequestId);

    List<PlatformSession> findAllByStatusOrderByStartedAtDesc(String status, Pageable pageable);

    List<PlatformSession> findAllBySessionTypeAndStatusOrderByStartedAtDesc(
        String sessionType, String status, Pageable pageable
    );

    @Query("""
        SELECT s FROM PlatformSession s
        WHERE (:status IS NULL OR s.status = :status)
          AND (:sessionType IS NULL OR s.sessionType = :sessionType)
          AND (
            :query IS NULL OR :query = ''
            OR LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY s.startedAt DESC
        """)
    List<PlatformSession> search(
        @Param("status") String status,
        @Param("sessionType") String sessionType,
        @Param("query") String query,
        Pageable pageable
    );

    long countByStatus(String status);

    long countBySessionType(String sessionType);

    @Query("""
        SELECT COUNT(DISTINCT s.hostId) FROM PlatformSession s
        WHERE s.startedAt >= :since
        """)
    long countDistinctHostsSince(@Param("since") java.time.Instant since);

    long countByStartedAtAfter(java.time.Instant after);
}
