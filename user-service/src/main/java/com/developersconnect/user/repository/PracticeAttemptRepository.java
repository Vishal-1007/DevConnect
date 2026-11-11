package com.developersconnect.user.repository;

import com.developersconnect.user.model.PracticeAttempt;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, UUID> {

    Optional<PracticeAttempt> findFirstByStudentIdAndProblemIdAndStatusOrderByStartedAtDesc(
        UUID studentId,
        UUID problemId,
        String status
    );

    List<PracticeAttempt> findByStudentIdAndStatusIn(UUID studentId, Collection<String> statuses);

    long countByStudentIdAndStatusIn(UUID studentId, Collection<String> statuses);

    @Query("""
        SELECT COALESCE(a.completedAt, a.startedAt) FROM PracticeAttempt a
        WHERE a.studentId = :userId AND a.startedAt >= :since
        """)
    List<Instant> findActivityTimestampsByStudentSince(
        @Param("userId") UUID userId,
        @Param("since") Instant since
    );
}
