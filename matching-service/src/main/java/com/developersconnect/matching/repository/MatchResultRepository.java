package com.developersconnect.matching.repository;

import com.developersconnect.matching.model.MatchResult;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchResultRepository extends JpaRepository<MatchResult, UUID> {

    List<MatchResult> findAllByRequestId(UUID requestId);
    boolean existsByRequestIdAndMatchedUserId(UUID requestId, UUID matchedUserId);
}
