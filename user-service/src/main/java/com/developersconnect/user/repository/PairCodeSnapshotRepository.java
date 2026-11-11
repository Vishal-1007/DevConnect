package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairCodeSnapshot;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairCodeSnapshotRepository extends JpaRepository<PairCodeSnapshot, UUID> {
    List<PairCodeSnapshot> findBySessionIdOrderBySavedAtDesc(UUID sessionId);
}
