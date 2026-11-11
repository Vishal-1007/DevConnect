package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorInterviewQuestionSave;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorInterviewQuestionSaveRepository
    extends JpaRepository<MentorInterviewQuestionSave, MentorInterviewQuestionSave.SaveId> {

    List<MentorInterviewQuestionSave> findByMentorId(UUID mentorId);

    boolean existsByMentorIdAndQuestionId(UUID mentorId, UUID questionId);

    void deleteByMentorIdAndQuestionId(UUID mentorId, UUID questionId);
}
