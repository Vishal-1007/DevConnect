package com.developersconnect.mentor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.developersconnect.mentor.model.LearningLesson;

public interface LearningLessonRepository extends JpaRepository<LearningLesson, UUID> {
    List<LearningLesson> findByCourseIdOrderBySortOrderAsc(UUID courseId);
    List<LearningLesson> findBySectionIdOrderBySortOrderAsc(UUID sectionId);
    void deleteByCourseId(UUID courseId);
    long countByCourseId(UUID courseId);
}
