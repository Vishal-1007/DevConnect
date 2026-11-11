package com.developersconnect.mentor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.mentor.model.WatchProgress;

public interface WatchProgressRepository extends JpaRepository<WatchProgress, UUID> {

    Optional<WatchProgress> findByLearnerIdAndLessonId(UUID learnerId, UUID lessonId);

    List<WatchProgress> findByLearnerIdOrderByUpdatedAtDesc(UUID learnerId);

    List<WatchProgress> findByLearnerIdAndCourseId(UUID learnerId, UUID courseId);

    Optional<WatchProgress> findFirstByLearnerIdAndCourseIdOrderByUpdatedAtDesc(UUID learnerId, UUID courseId);

    @Query("""
        SELECT COALESCE(SUM(w.watchedDurationSeconds), 0) FROM WatchProgress w
        WHERE w.courseId IN (SELECT c.id FROM LearningCourse c WHERE c.mentorId = :creatorId)
        """)
    long sumWatchTimeSecondsByCreator(@Param("creatorId") UUID creatorId);

    @Query("""
        SELECT COUNT(w) FROM WatchProgress w
        WHERE w.courseId IN (SELECT c.id FROM LearningCourse c WHERE c.mentorId = :creatorId)
        """)
    long countViewsByCreator(@Param("creatorId") UUID creatorId);
}
