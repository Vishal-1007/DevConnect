package com.developersconnect.user.repository;

import com.developersconnect.user.model.CodingChallengeSolve;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodingChallengeSolveRepository extends JpaRepository<CodingChallengeSolve, UUID> {

    long countByUserId(UUID userId);

    Optional<CodingChallengeSolve> findByUserIdAndChallengeId(UUID userId, UUID challengeId);

    List<CodingChallengeSolve> findByUserIdAndChallengeIdIn(UUID userId, Collection<UUID> challengeIds);
}
