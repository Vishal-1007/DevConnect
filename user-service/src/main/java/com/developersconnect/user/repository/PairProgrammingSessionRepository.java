package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairProgrammingSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PairProgrammingSessionRepository extends JpaRepository<PairProgrammingSession, UUID> {
    Optional<PairProgrammingSession> findBySessionCodeIgnoreCase(String sessionCode);
    Optional<PairProgrammingSession> findByAssignmentId(UUID assignmentId);

    @Query("""
        SELECT COALESCE(s.endedAt, s.startedAt, s.createdAt) FROM PairProgrammingSession s
        WHERE (s.hostId = :userId OR s.studentId = :userId OR s.mentorId = :userId OR s.creatorId = :userId)
          AND s.createdAt >= :since
        """)
    List<Instant> findActivityTimestampsByParticipantSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );

    @Query("""
        SELECT s FROM PairProgrammingSession s
        WHERE (s.hostId = :userId OR s.studentId = :userId OR s.mentorId = :userId OR s.creatorId = :userId)
          AND s.status = 'COMPLETED'
        """)
    List<PairProgrammingSession> findCompletedByParticipant(@Param("userId") UUID userId);

    @Query("""
        SELECT COUNT(s) FROM PairProgrammingSession s
        WHERE (s.hostId = :userId OR s.studentId = :userId OR s.mentorId = :userId OR s.creatorId = :userId)
          AND s.status = 'COMPLETED'
        """)
    long countCompletedByParticipant(@Param("userId") UUID userId);
}
