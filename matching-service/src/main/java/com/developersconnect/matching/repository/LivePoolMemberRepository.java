package com.developersconnect.matching.repository;

import com.developersconnect.matching.model.LivePoolMember;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LivePoolMemberRepository extends JpaRepository<LivePoolMember, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT m FROM LivePoolMember m
        WHERE m.role = 'MENTOR'
          AND m.liveEnabled = true
          AND m.poolStatus = 'AVAILABLE'
        ORDER BY m.updatedAt ASC
        """)
    List<LivePoolMember> findAvailableMentorsForUpdate(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT m FROM LivePoolMember m
        WHERE m.role = 'LEARNER'
          AND m.poolStatus = 'AVAILABLE'
        ORDER BY m.updatedAt ASC
        """)
    List<LivePoolMember> findWaitingLearnersForUpdate(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM LivePoolMember m WHERE m.userId = :userId")
    Optional<LivePoolMember> findByUserIdForUpdate(@Param("userId") UUID userId);
}
