package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityEventRole;
import com.developersconnect.user.model.CommunityEventRole.EventRoleId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityEventRoleRepository extends JpaRepository<CommunityEventRole, EventRoleId> {

    List<CommunityEventRole> findAllByUserIdOrderByAppliedAtDesc(UUID userId);

    List<CommunityEventRole> findAllByEventId(UUID eventId);

    List<CommunityEventRole> findAllByEventIdAndUserId(UUID eventId, UUID userId);

    boolean existsByEventIdAndUserIdAndRole(UUID eventId, UUID userId, String role);

    long countByUserIdAndStatus(UUID userId, String status);

    long countByUserId(UUID userId);
}
