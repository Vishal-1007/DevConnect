package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.AiReviewPaymentCredit;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiReviewPaymentCreditRepository extends JpaRepository<AiReviewPaymentCredit, UUID> {

    boolean existsByPaymentId(UUID paymentId);
}
