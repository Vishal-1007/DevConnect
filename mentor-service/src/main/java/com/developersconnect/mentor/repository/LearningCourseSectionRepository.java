package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningCourseSection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningCourseSectionRepository extends JpaRepository<LearningCourseSection, UUID> {
    List<LearningCourseSection> findByCourseIdOrderBySortOrderAsc(UUID courseId);
    void deleteByCourseId(UUID courseId);
}
