package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.RecruiterPlanType;
import com.developersconnect.payment.model.RecruiterSubscription;
import com.developersconnect.payment.model.RecruiterSubscriptionStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterSubscriptionRepository extends JpaRepository<RecruiterSubscription, UUID> {

    Optional<RecruiterSubscription> findByRecruiterId(UUID recruiterId);

    List<RecruiterSubscription> findByStatusAndExpiryDateBefore(
        RecruiterSubscriptionStatus status,
        Instant expiryDate
    );

    List<RecruiterSubscription> findByPlanTypeNot(RecruiterPlanType planType);
}
