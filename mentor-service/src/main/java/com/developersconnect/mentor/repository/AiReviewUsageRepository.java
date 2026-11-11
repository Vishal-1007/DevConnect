package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.AiReviewUsage;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiReviewUsageRepository extends JpaRepository<AiReviewUsage, UUID> {

    Optional<AiReviewUsage> findByUserIdAndReviewDate(UUID userId, LocalDate reviewDate);
}
