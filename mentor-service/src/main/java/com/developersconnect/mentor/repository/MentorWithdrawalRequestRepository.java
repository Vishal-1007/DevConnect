package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorWithdrawalRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorWithdrawalRequestRepository extends JpaRepository<MentorWithdrawalRequest, UUID> {

    List<MentorWithdrawalRequest> findAllByMentorIdOrderByRequestedAtDesc(UUID mentorId);

    @Query("SELECT COALESCE(SUM(w.amountCents), 0) FROM MentorWithdrawalRequest w WHERE w.mentorId = :mentorId AND w.status = :status")
    long sumAmountCentsByMentorIdAndStatus(@Param("mentorId") UUID mentorId, @Param("status") String status);
}
