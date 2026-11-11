package com.developersconnect.user.repository;

import com.developersconnect.user.model.PairProgrammingInvitation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairProgrammingInvitationRepository extends JpaRepository<PairProgrammingInvitation, UUID> {

    Optional<PairProgrammingInvitation> findBySessionIdAndReceiverId(UUID sessionId, UUID receiverId);

    List<PairProgrammingInvitation> findByReceiverIdAndStatusOrderByCreatedAtDesc(UUID receiverId, String status);

    List<PairProgrammingInvitation> findBySenderIdOrderByCreatedAtDesc(UUID senderId);
}
