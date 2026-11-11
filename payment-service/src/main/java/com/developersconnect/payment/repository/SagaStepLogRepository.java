package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.SagaStepLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SagaStepLogRepository extends JpaRepository<SagaStepLog, UUID> {
}
