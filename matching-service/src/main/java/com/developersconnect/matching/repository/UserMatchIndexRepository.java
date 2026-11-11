package com.developersconnect.matching.repository;

import com.developersconnect.matching.model.UserMatchIndex;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserMatchIndexRepository extends JpaRepository<UserMatchIndex, UUID> {

    @Query("select u from UserMatchIndex u where u.userId <> :requesterId")
    List<UserMatchIndex> findCandidates(@Param("requesterId") UUID requesterId);
}
