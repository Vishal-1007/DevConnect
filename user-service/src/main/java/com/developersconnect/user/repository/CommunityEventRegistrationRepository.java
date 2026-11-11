package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.CommunityEventRegistrationId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityEventRegistrationRepository extends JpaRepository<CommunityEventRegistration, CommunityEventRegistrationId> {

    long countByEventId(UUID eventId);

    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

    void deleteByEventIdAndUserId(UUID eventId, UUID userId);

    java.util.List<CommunityEventRegistration> findAllByEventIdOrderByRegisteredAtAsc(UUID eventId);

    long countByEventIdAndAttendedTrue(UUID eventId);
}
