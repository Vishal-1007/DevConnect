package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MockInterviewRequest;
import com.developersconnect.mentor.model.MockInterviewRequest.Status;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MockInterviewRequestRepository extends JpaRepository<MockInterviewRequest, UUID> {

    List<MockInterviewRequest> findByLearnerIdOrderByCreatedAtDesc(UUID learnerId);

    List<MockInterviewRequest> findByLearnerIdAndStatusOrderByCreatedAtDesc(UUID learnerId, Status status);

    List<MockInterviewRequest> findByInterviewerIdOrderByCreatedAtDesc(UUID interviewerId);

    List<MockInterviewRequest> findByInterviewerIdAndStatusOrderByCreatedAtDesc(UUID interviewerId, Status status);

    @Query("""
        SELECT COUNT(r) > 0 FROM MockInterviewRequest r
        WHERE r.learnerId = :learnerId AND r.interviewerId = :interviewerId AND r.status IN :statuses
        """)
    boolean hasLearnerInterviewerRequestInStatuses(
        @Param("learnerId") UUID learnerId,
        @Param("interviewerId") UUID interviewerId,
        @Param("statuses") Collection<Status> statuses
    );

    @Query("""
        SELECT r FROM MockInterviewRequest r
        WHERE r.learnerId = :learnerId AND r.interviewerId = :interviewerId AND r.status IN :statuses
        ORDER BY r.createdAt DESC
        """)
    List<MockInterviewRequest> loadBlockingRequestsForPair(
        @Param("learnerId") UUID learnerId,
        @Param("interviewerId") UUID interviewerId,
        @Param("statuses") Collection<Status> statuses,
        Pageable pageable
    );

    @Query("""
        SELECT r FROM MockInterviewRequest r
        WHERE r.interviewerId = :interviewerId AND r.scheduledAt IS NOT NULL AND r.status IN :statuses
        """)
    List<MockInterviewRequest> loadScheduledByInterviewerAndStatuses(
        @Param("interviewerId") UUID interviewerId,
        @Param("statuses") Collection<Status> statuses
    );

    @Query("""
        SELECT COUNT(r) > 0 FROM MockInterviewRequest r
        WHERE r.interviewerId = :interviewerId
          AND r.scheduledAt >= :start AND r.scheduledAt < :end
          AND r.status IN :statuses
        """)
    boolean hasInterviewerBookingBetween(
        @Param("interviewerId") UUID interviewerId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("statuses") Collection<Status> statuses
    );
}
