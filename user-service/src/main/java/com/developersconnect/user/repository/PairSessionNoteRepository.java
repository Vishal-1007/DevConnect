package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairSessionNote;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairSessionNoteRepository extends JpaRepository<PairSessionNote, UUID> {
    Optional<PairSessionNote> findBySessionId(UUID sessionId);
}
