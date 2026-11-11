package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.Payment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByProviderReference(String providerReference);

    List<Payment> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
