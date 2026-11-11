package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairChatMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairChatMessageRepository extends JpaRepository<PairChatMessage, UUID> {
    List<PairChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
