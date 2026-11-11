package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.AiInterviewQuestion;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiInterviewQuestionRepository extends JpaRepository<AiInterviewQuestion, UUID> {
    List<AiInterviewQuestion> findByInterviewIdOrderByQuestionOrderAsc(UUID interviewId);
    int countByInterviewId(UUID interviewId);
}
