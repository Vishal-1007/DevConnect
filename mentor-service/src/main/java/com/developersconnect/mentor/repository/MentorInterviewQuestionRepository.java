package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorInterviewQuestion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorInterviewQuestionRepository extends JpaRepository<MentorInterviewQuestion, UUID> {

    List<MentorInterviewQuestion> findByMentorIdIsNullOrderByCategoryAscDifficultyAsc();

    List<MentorInterviewQuestion> findByMentorIdOrderByUpdatedAtDesc(UUID mentorId);

    Optional<MentorInterviewQuestion> findByIdAndMentorId(UUID id, UUID mentorId);

    long countByMentorIdIsNull();
}
