package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.OutboxEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    @Query("SELECT o FROM OutboxEvent o WHERE o.publishedAt IS NULL ORDER BY o.createdAt ASC")
    List<OutboxEvent> findUnpublished();
}
