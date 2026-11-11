package com.developersconnect.user.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.user.model.VideoRoomPaymentTransaction;

public interface VideoRoomPaymentTransactionRepository extends JpaRepository<VideoRoomPaymentTransaction, UUID> {

    boolean existsByPaymentId(UUID paymentId);

    @Query("SELECT COUNT(t) FROM VideoRoomPaymentTransaction t WHERE t.status = :status")
    long countByPaymentStatus(@Param("status") String status);

    @Query("SELECT COALESCE(SUM(t.amountCents), 0) FROM VideoRoomPaymentTransaction t WHERE t.status = :status")
    long sumAmountCentsByStatus(@Param("status") String status);
}
