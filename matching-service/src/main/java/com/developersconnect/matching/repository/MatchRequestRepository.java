package com.developersconnect.matching.repository;

import com.developersconnect.matching.model.MatchRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, UUID> {

    List<MatchRequest> findAllByRequesterIdOrderByCreatedAtDesc(UUID requesterId);
    List<MatchRequest> findTop10ByRequesterIdAndStatusOrderByCreatedAtDesc(UUID requesterId, String status);

    @Query(
        "SELECT r FROM MatchRequest r "
            + "WHERE r.requesterId <> :requesterId "
            + "ORDER BY r.createdAt DESC"
    )
    List<MatchRequest> findRecentByOtherRequesters(@Param("requesterId") UUID requesterId);
}
