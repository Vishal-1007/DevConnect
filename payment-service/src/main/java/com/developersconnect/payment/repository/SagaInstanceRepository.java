package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.SagaInstance;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SagaInstanceRepository extends JpaRepository<SagaInstance, UUID> {

    Optional<SagaInstance> findByPaymentId(UUID paymentId);
}
