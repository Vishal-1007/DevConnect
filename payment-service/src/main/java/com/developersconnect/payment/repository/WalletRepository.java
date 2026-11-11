package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.Wallet;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, UUID> {
}
