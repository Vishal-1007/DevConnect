package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.SavedCourse;
import com.developersconnect.mentor.model.SavedCourse.Id;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SavedCourseRepository extends JpaRepository<SavedCourse, Id> {
    boolean existsByIdLearnerIdAndIdCourseId(UUID learnerId, UUID courseId);

    @Query("SELECT s.id.courseId FROM SavedCourse s WHERE s.id.learnerId = :learnerId")
    List<UUID> findSavedCourseIds(UUID learnerId);
}
