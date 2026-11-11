package com.developersconnect.matching.repository;

import com.developersconnect.matching.model.LiveMatchAssignment;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LiveMatchAssignmentRepository extends JpaRepository<LiveMatchAssignment, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM LiveMatchAssignment a WHERE a.id = :id")
    Optional<LiveMatchAssignment> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        SELECT a FROM LiveMatchAssignment a
        WHERE a.mentorId = :mentorId
          AND a.status IN ('PENDING_ACCEPT', 'ACTIVE')
        """)
    Optional<LiveMatchAssignment> findActiveForMentor(@Param("mentorId") UUID mentorId);

    @Query("""
        SELECT a FROM LiveMatchAssignment a
        WHERE a.learnerId = :learnerId
          AND a.status IN ('PENDING_ACCEPT', 'ACTIVE')
        """)
    Optional<LiveMatchAssignment> findActiveForLearner(@Param("learnerId") UUID learnerId);

    @Query("""
        SELECT a FROM LiveMatchAssignment a
        WHERE a.status = 'PENDING_ACCEPT'
          AND a.expiresAt IS NOT NULL
          AND a.expiresAt <= :now
        """)
    List<LiveMatchAssignment> findExpiredPending(@Param("now") Instant now);
}
