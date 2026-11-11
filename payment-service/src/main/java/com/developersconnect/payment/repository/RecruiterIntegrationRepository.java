package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterIntegrationRepository extends JpaRepository<RecruiterIntegration, UUID> {

    List<RecruiterIntegration> findByRecruiterId(UUID recruiterId);

    Optional<RecruiterIntegration> findByRecruiterIdAndProvider(
        UUID recruiterId,
        RecruiterIntegrationProvider provider
    );
}
