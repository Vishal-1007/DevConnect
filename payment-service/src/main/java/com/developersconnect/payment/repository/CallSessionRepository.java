package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.CallSession;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallSessionRepository extends JpaRepository<CallSession, UUID> {
    List<CallSession> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<CallSession> findByMentorIdOrderByCreatedAtDesc(UUID mentorId);

    List<CallSession> findByStatus(String status);

    Optional<CallSession> findByIdAndUserId(UUID id, UUID userId);

    long countByMentorIdAndStatus(UUID mentorId, String status);
}
