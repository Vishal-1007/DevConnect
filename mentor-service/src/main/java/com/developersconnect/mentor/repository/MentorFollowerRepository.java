package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorFollower;
import com.developersconnect.mentor.model.MentorFollower.Id;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MentorFollowerRepository extends JpaRepository<MentorFollower, Id> {
    boolean existsByIdMentorIdAndIdLearnerId(UUID mentorId, UUID learnerId);
    long countByIdMentorId(UUID mentorId);

    @Query("SELECT f.id.mentorId FROM MentorFollower f WHERE f.id.learnerId = :learnerId")
    List<UUID> findFollowedMentorIds(UUID learnerId);
}
