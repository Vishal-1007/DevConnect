package com.developersconnect.notification.repository;

import com.developersconnect.notification.model.ProcessedPaymentEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedPaymentEventRepository extends JpaRepository<ProcessedPaymentEvent, UUID> {
}
