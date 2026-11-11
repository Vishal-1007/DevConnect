package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorPricing;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorPricingRepository extends JpaRepository<MentorPricing, UUID> {
    List<MentorPricing> findByStatusAndInstantCallEnabledTrueOrderByUpdatedAtDesc(String status);
}
