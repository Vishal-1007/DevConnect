package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorRecurringPlan;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorRecurringPlanRepository extends JpaRepository<MentorRecurringPlan, UUID> {

    List<MentorRecurringPlan> findByMentorIdOrderByCreatedAtDesc(UUID mentorId);
}
