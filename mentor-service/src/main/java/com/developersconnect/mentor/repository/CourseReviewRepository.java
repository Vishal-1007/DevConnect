package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.CourseReview;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseReviewRepository extends JpaRepository<CourseReview, UUID> {
    List<CourseReview> findByCourseIdOrderByCreatedAtDesc(UUID courseId);
}
