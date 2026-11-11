package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MockInterviewFeedback;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MockInterviewFeedbackRepository extends JpaRepository<MockInterviewFeedback, UUID> {

    Optional<MockInterviewFeedback> findBySessionId(UUID sessionId);

    List<MockInterviewFeedback> findByInterviewerIdOrderByCreatedAtDesc(UUID interviewerId);
}
