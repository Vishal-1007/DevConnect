package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.PremiumSubscription;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PremiumSubscriptionRepository extends JpaRepository<PremiumSubscription, UUID> {

    long countByStatusAndPremiumTrue(String status);

    List<PremiumSubscription> findAllByPremiumTrueOrderByStartedAtDesc();
}
