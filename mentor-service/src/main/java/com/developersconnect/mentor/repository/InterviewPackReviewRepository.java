package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewPackReview;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewPackReviewRepository extends JpaRepository<InterviewPackReview, UUID> {

    List<InterviewPackReview> findByQuestionSetIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID questionSetId);

    boolean existsByQuestionSetIdAndLearnerIdAndDeletedAtIsNull(UUID questionSetId, UUID learnerId);
}
