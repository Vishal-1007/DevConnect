package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewMentorFeedback;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewMentorFeedbackRepository extends JpaRepository<InterviewMentorFeedback, UUID> {

    Optional<InterviewMentorFeedback> findByAssignmentId(UUID assignmentId);

    List<InterviewMentorFeedback> findByLearnerIdOrderByReviewedAtDesc(UUID learnerId);
}
