package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorshipRequest;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorshipRequestRepository extends JpaRepository<MentorshipRequest, UUID> {

    List<MentorshipRequest> findByMentorIdOrderByCreatedAtDesc(UUID mentorId);

    List<MentorshipRequest> findByMentorIdAndStatusOrderByCreatedAtDesc(
        UUID mentorId, MentorshipRequest.Status status
    );

    long countByMentorIdAndStatus(UUID mentorId, MentorshipRequest.Status status);

    List<MentorshipRequest> findByLearnerIdOrderByCreatedAtDesc(UUID learnerId);

    List<MentorshipRequest> findByLearnerIdAndStatusOrderByCreatedAtDesc(
        UUID learnerId, MentorshipRequest.Status status
    );

    List<MentorshipRequest> findAllByStatus(MentorshipRequest.Status status);

    Optional<MentorshipRequest> findFirstByMentorIdAndLearnerIdAndStatus(
        UUID mentorId, UUID learnerId, MentorshipRequest.Status status
    );

    @Query("""
        SELECT COUNT(r) > 0 FROM MentorshipRequest r
        WHERE r.mentorId = :mentorId AND r.learnerId = :learnerId AND r.status IN :statuses
        """)
    boolean existsByMentorIdAndLearnerIdAndStatusIn(
        @Param("mentorId") UUID mentorId,
        @Param("learnerId") UUID learnerId,
        @Param("statuses") Collection<MentorshipRequest.Status> statuses
    );
}
