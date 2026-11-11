package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorMentorshipPlan;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorMentorshipPlanRepository extends JpaRepository<MentorMentorshipPlan, UUID> {

    List<MentorMentorshipPlan> findByMentorIdOrderBySortOrderAsc(UUID mentorId);

    Optional<MentorMentorshipPlan> findByIdAndMentorId(UUID id, UUID mentorId);

    long countByMentorId(UUID mentorId);
}
