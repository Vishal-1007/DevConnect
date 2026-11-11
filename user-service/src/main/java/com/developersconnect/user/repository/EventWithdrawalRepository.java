package com.developersconnect.user.repository;

import com.developersconnect.user.model.EventWithdrawal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventWithdrawalRepository extends JpaRepository<EventWithdrawal, UUID> {

    List<EventWithdrawal> findAllByStatusOrderByRequestedAtDesc(String status);

    List<EventWithdrawal> findAllByMentorIdOrderByRequestedAtDesc(UUID mentorId);
}
