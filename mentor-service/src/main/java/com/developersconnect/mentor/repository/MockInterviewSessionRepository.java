package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MockInterviewSession;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MockInterviewSessionRepository extends JpaRepository<MockInterviewSession, UUID> {

    Optional<MockInterviewSession> findByRequestId(UUID requestId);

    Optional<MockInterviewSession> findBySessionCodeIgnoreCase(String sessionCode);
}
