package com.developersconnect.mentor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.mentor.model.MentorStudentRecord;

public interface MentorStudentRecordRepository extends JpaRepository<MentorStudentRecord, UUID> {

    List<MentorStudentRecord> findByMentorIdOrderByUpdatedAtDesc(UUID mentorId);

    @Query("""
        SELECT r FROM MentorStudentRecord r
        WHERE r.mentorId = :mentorId AND r.status = :status
        ORDER BY r.acceptedAt DESC
        """)
    List<MentorStudentRecord> listActiveStudentsByMentorId(
        @Param("mentorId") UUID mentorId,
        @Param("status") String status
    );

    Optional<MentorStudentRecord> findByMentorIdAndLearnerId(UUID mentorId, UUID learnerId);

    List<MentorStudentRecord> findByMentorIdAndCategoryOrderByUpdatedAtDesc(UUID mentorId, String category);

    List<MentorStudentRecord> findByLearnerIdAndStatusOrderByAcceptedAtDesc(UUID learnerId, String status);

    long countByMentorIdAndStatus(UUID mentorId, String status);
}
