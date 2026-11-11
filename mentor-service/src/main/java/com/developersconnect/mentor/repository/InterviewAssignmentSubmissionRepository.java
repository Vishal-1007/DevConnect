package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewAssignmentSubmission;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewAssignmentSubmissionRepository extends JpaRepository<InterviewAssignmentSubmission, UUID> {

    List<InterviewAssignmentSubmission> findByAssignmentIdOrderBySubmittedAtAsc(UUID assignmentId);

    Optional<InterviewAssignmentSubmission> findByAssignmentIdAndQuestionId(UUID assignmentId, UUID questionId);
}
