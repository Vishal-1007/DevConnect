package com.developersconnect.user.repository;

import com.developersconnect.user.model.UserVideoRoomSubscription;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserVideoRoomSubscriptionRepository extends JpaRepository<UserVideoRoomSubscription, UUID> {

    Optional<UserVideoRoomSubscription> findByUserId(UUID userId);

    long countByVideoRoomPremiumTrue();
}
