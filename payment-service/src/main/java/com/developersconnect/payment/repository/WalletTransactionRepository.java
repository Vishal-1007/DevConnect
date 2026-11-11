package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.WalletTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {
    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
