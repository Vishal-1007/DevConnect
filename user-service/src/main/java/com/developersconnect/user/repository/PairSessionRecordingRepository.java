package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairSessionRecording;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairSessionRecordingRepository extends JpaRepository<PairSessionRecording, UUID> {
    Optional<PairSessionRecording> findFirstBySessionIdAndStatusOrderByStartedAtDesc(
        UUID sessionId, String status
    );
}
