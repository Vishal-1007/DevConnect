package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformNotificationCampaign;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformNotificationCampaignRepository extends JpaRepository<PlatformNotificationCampaign, UUID> {

    List<PlatformNotificationCampaign> findAllByOrderByCreatedAtDesc();

    long countByStatus(String status);

    List<PlatformNotificationCampaign> findByStatusAndScheduledAtLessThanEqual(String status, Instant scheduledAt);
}
