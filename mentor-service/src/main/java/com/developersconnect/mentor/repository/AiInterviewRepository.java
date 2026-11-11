package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.AiInterview;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiInterviewRepository extends JpaRepository<AiInterview, UUID> {
    List<AiInterview> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<AiInterview> findByIdAndUserId(UUID id, UUID userId);
}
