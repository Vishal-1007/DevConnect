package com.developersconnect.user.repository;

import com.developersconnect.user.model.CodingChallenge;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CodingChallengeRepository
    extends JpaRepository<CodingChallenge, UUID>, JpaSpecificationExecutor<CodingChallenge> {

    long countByPublishedTrue();

    long countByStatus(String status);

    List<CodingChallenge> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);
}
