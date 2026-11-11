package com.developersconnect.mentor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.mentor.model.InterviewQuestionSetPurchase;

public interface InterviewQuestionSetPurchaseRepository extends JpaRepository<InterviewQuestionSetPurchase, UUID> {

    List<InterviewQuestionSetPurchase> findByLearnerIdAndDeletedAtIsNullOrderByPurchasedAtDesc(UUID learnerId);

    Optional<InterviewQuestionSetPurchase> findByQuestionSetIdAndLearnerIdAndDeletedAtIsNull(
        UUID questionSetId, UUID learnerId
    );

    boolean existsByQuestionSetIdAndLearnerIdAndDeletedAtIsNull(UUID questionSetId, UUID learnerId);

    @Query("SELECT COALESCE(SUM(p.amountCents), 0) FROM InterviewQuestionSetPurchase p "
        + "WHERE p.deletedAt IS NULL AND p.status = 'COMPLETED' "
        + "AND p.questionSetId IN ("
        + "SELECT s.id FROM InterviewQuestionSet s WHERE s.mentorId = :mentorId AND s.deletedAt IS NULL)")
    long sumRevenueCentsByMentor(@Param("mentorId") UUID mentorId);

    @Query("SELECT COUNT(p) FROM InterviewQuestionSetPurchase p "
        + "WHERE p.deletedAt IS NULL AND p.status = 'COMPLETED' "
        + "AND p.questionSetId IN ("
        + "SELECT s.id FROM InterviewQuestionSet s WHERE s.mentorId = :mentorId AND s.deletedAt IS NULL)")
    long countPurchasesByMentor(@Param("mentorId") UUID mentorId);

    long countByQuestionSetIdAndDeletedAtIsNull(UUID questionSetId);
}
