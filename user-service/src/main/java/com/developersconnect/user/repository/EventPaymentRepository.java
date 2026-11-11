package com.developersconnect.user.repository;

import com.developersconnect.user.model.EventPayment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EventPaymentRepository extends JpaRepository<EventPayment, UUID> {

    boolean existsByPaymentId(UUID paymentId);

    List<EventPayment> findAllByEventIdOrderByCreatedAtDesc(UUID eventId);

    List<EventPayment> findAllByMentorIdOrderByCreatedAtDesc(UUID mentorId);

    @Query("SELECT COALESCE(SUM(p.amountCents), 0) FROM EventPayment p WHERE p.status = 'completed'")
    long sumCompletedAmountCents();

    @Query("SELECT COALESCE(SUM(p.platformShareCents), 0) FROM EventPayment p WHERE p.status = 'completed'")
    long sumCompletedPlatformShareCents();

    @Query("SELECT COALESCE(SUM(p.mentorShareCents), 0) FROM EventPayment p WHERE p.status = 'completed'")
    long sumCompletedMentorShareCents();

    long countByStatus(String status);
}
