package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorStudentTask;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorStudentTaskRepository extends JpaRepository<MentorStudentTask, UUID> {

    List<MentorStudentTask> findByMentorIdAndLearnerIdOrderByCreatedAtDesc(UUID mentorId, UUID learnerId);

    long countByMentorIdAndLearnerId(UUID mentorId, UUID learnerId);

    long countByMentorIdAndLearnerIdAndStatusNot(UUID mentorId, UUID learnerId, String status);

    Optional<MentorStudentTask> findByIdAndMentorIdAndLearnerId(UUID id, UUID mentorId, UUID learnerId);
}
