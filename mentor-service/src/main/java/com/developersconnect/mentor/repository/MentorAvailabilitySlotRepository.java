package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorAvailabilitySlotRepository extends JpaRepository<MentorAvailabilitySlot, UUID> {

    List<MentorAvailabilitySlot> findAllByMentorIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(UUID mentorId);

    List<MentorAvailabilitySlot> findAllByActiveTrueOrderByMentorIdAscDayOfWeekAscStartTimeAsc();

    long countByMentorIdAndActiveTrue(UUID mentorId);

    List<MentorAvailabilitySlot> findAllByMentorIdOrderByDayOfWeekAscStartTimeAsc(UUID mentorId);

    void deleteByMentorId(UUID mentorId);
}
