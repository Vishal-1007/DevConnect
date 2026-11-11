package com.developersconnect.user.repository;

import com.developersconnect.user.model.MentorWallet;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorWalletRepository extends JpaRepository<MentorWallet, UUID> {
}
