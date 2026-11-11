package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairWhiteboardData;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairWhiteboardDataRepository extends JpaRepository<PairWhiteboardData, UUID> {
    Optional<PairWhiteboardData> findBySessionId(UUID sessionId);
}
