package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorReview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorReviewRepository extends JpaRepository<MentorReview, UUID> {

    List<MentorReview> findByMentorIdOrderByCreatedAtDesc(UUID mentorId);

    List<MentorReview> findByMentorIdAndShowcasedTrueOrderByCreatedAtDesc(UUID mentorId);

    Optional<MentorReview> findByIdAndMentorId(UUID id, UUID mentorId);

    Optional<MentorReview> findByMentorIdAndLearnerId(UUID mentorId, UUID learnerId);

    long countByMentorId(UUID mentorId);

    @Query("""
        SELECT COUNT(r) FROM MentorReview r
        WHERE r.mentorId = :mentorId
          AND r.reviewText IS NOT NULL
          AND TRIM(r.reviewText) <> ''
        """)
    long countTestimonialsWithComment(@Param("mentorId") UUID mentorId);
}
