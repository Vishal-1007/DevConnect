package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorStudentRoadmapItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorStudentRoadmapItemRepository extends JpaRepository<MentorStudentRoadmapItem, UUID> {

    List<MentorStudentRoadmapItem> findByMentorIdAndLearnerIdOrderBySortOrderAsc(UUID mentorId, UUID learnerId);

    Optional<MentorStudentRoadmapItem> findByIdAndMentorIdAndLearnerId(UUID id, UUID mentorId, UUID learnerId);
}
