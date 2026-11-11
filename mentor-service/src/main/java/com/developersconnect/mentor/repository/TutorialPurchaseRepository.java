package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TutorialPurchase;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorialPurchaseRepository extends JpaRepository<TutorialPurchase, UUID> {
    Optional<TutorialPurchase> findByUserIdAndTutorialIdAndPaymentStatus(UUID userId, UUID tutorialId, String status);
    List<TutorialPurchase> findByUserId(UUID userId);
    boolean existsByUserIdAndTutorialIdAndPaymentStatus(UUID userId, UUID tutorialId, String status);
}
