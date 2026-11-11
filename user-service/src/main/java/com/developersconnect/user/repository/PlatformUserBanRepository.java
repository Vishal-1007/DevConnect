package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformUserBan;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformUserBanRepository extends JpaRepository<PlatformUserBan, UUID> {

    List<PlatformUserBan> findAllByActiveTrueOrderByBannedAtDesc();

    List<PlatformUserBan> findAllByOrderByBannedAtDesc();

    long countByAccountId(UUID accountId);

    long countByActiveTrue();

    long countByBanTypeAndActiveTrue(String banType);

    long countByAccountIdAndActiveTrue(UUID accountId);
}
