package com.developersconnect.user.repository;

import com.developersconnect.user.model.ProblemAttempt;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProblemAttemptRepository extends JpaRepository<ProblemAttempt, UUID> {

    long countByStudentIdAndStatus(UUID studentId, String status);

    long countByProblemIdAndStatus(UUID problemId, String status);

    @Query("SELECT COUNT(DISTINCT a.studentId) FROM ProblemAttempt a WHERE a.problemId = :problemId AND a.status = :status")
    long countDistinctStudentsByProblemIdAndStatus(@Param("problemId") UUID problemId, @Param("status") String status);

    Optional<ProblemAttempt> findFirstByStudentIdAndProblemIdAndStatusOrderBySubmittedAtDesc(
        UUID studentId, UUID problemId, String status
    );

    List<ProblemAttempt> findByStudentIdAndProblemIdIn(UUID studentId, Collection<UUID> problemIds);

    List<ProblemAttempt> findByStudentIdOrderBySubmittedAtDesc(UUID studentId);

    @Query("""
        SELECT a.submittedAt FROM ProblemAttempt a
        WHERE a.studentId = :userId AND a.submittedAt >= :since
        """)
    List<Instant> findActivityTimestampsByStudentSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
