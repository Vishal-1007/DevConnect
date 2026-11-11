package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.CoursePurchase;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoursePurchaseRepository extends JpaRepository<CoursePurchase, UUID> {
    boolean existsByCourseIdAndLearnerIdAndStatus(UUID courseId, UUID learnerId, String status);
    Optional<CoursePurchase> findByCourseIdAndLearnerIdAndStatus(UUID courseId, UUID learnerId, String status);
    long countByCourseIdAndLearnerIdAndStatus(UUID courseId, UUID learnerId, String status);
    List<CoursePurchase> findByLearnerIdOrderByPurchasedAtDesc(UUID learnerId);

    @Query("""
        SELECT COALESCE(SUM(p.amountCents), 0) FROM CoursePurchase p
        WHERE p.status = 'COMPLETED'
          AND p.courseId IN (SELECT c.id FROM LearningCourse c WHERE c.mentorId = :creatorId)
        """)
    long sumRevenueCentsByCreator(@Param("creatorId") UUID creatorId);

    @Query("""
        SELECT COUNT(p) FROM CoursePurchase p
        WHERE p.status = 'COMPLETED'
          AND p.courseId IN (SELECT c.id FROM LearningCourse c WHERE c.mentorId = :creatorId)
        """)
    long countEnrollmentsByCreator(@Param("creatorId") UUID creatorId);

    @Query("""
        SELECT p.courseId FROM CoursePurchase p
        WHERE p.learnerId = :learnerId AND p.status = 'COMPLETED'
        ORDER BY p.purchasedAt DESC
        """)
    List<UUID> findPurchasedCourseIds(@Param("learnerId") UUID learnerId);
}
