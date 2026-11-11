package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostPollVote;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostPollVoteRepository extends JpaRepository<CommunityPostPollVote, UUID> {
    Optional<CommunityPostPollVote> findByPollIdAndUserId(UUID pollId, UUID userId);
    boolean existsByPollIdAndUserId(UUID pollId, UUID userId);
}
