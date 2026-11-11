package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairParticipant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairParticipantRepository extends JpaRepository<PairParticipant, UUID> {
    List<PairParticipant> findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(UUID sessionId);
    Optional<PairParticipant> findBySessionIdAndUserIdAndLeftAtIsNull(UUID sessionId, UUID userId);
    long countBySessionIdAndLeftAtIsNull(UUID sessionId);
}
