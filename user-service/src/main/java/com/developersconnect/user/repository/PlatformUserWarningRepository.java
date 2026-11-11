package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformUserWarning;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformUserWarningRepository extends JpaRepository<PlatformUserWarning, UUID> {

    List<PlatformUserWarning> findAllByOrderByCreatedAtDesc();

    long countByAcknowledgedFalse();

    long countByAccountId(UUID accountId);
}
