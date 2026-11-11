package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewQuestionAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewQuestionAssignmentRepository extends JpaRepository<InterviewQuestionAssignment, UUID> {

    List<InterviewQuestionAssignment> findByLearnerIdAndDeletedAtIsNullOrderByAssignedAtDesc(UUID learnerId);

    List<InterviewQuestionAssignment> findByMentorIdAndDeletedAtIsNullOrderByAssignedAtDesc(UUID mentorId);

    List<InterviewQuestionAssignment> findByMentorIdAndStatusAndDeletedAtIsNullOrderByAssignedAtDesc(
        UUID mentorId, String status
    );

    Optional<InterviewQuestionAssignment> findByIdAndLearnerIdAndDeletedAtIsNull(UUID id, UUID learnerId);

    Optional<InterviewQuestionAssignment> findByIdAndMentorIdAndDeletedAtIsNull(UUID id, UUID mentorId);

    long countByMentorIdAndStatusAndDeletedAtIsNull(UUID mentorId, String status);
}
