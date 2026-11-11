package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.MentorPayout;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MentorPayoutRepository extends JpaRepository<MentorPayout, UUID> {

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(p.amountCents), 0) FROM MentorPayout p WHERE p.status = 'pending'")
    long sumPendingPayoutCents();

    List<MentorPayout> findAllByStatusOrderByCreatedAtDesc(String status);

    List<MentorPayout> findAllByOrderByCreatedAtDesc();
}
