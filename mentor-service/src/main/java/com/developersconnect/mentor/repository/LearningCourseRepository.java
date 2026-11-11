package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningCourse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningCourseRepository extends JpaRepository<LearningCourse, UUID> {

    List<LearningCourse> findByMentorIdOrderByUpdatedAtDesc(UUID mentorId);

    Page<LearningCourse> findByStatusOrderByPublishedAtDesc(String status, Pageable pageable);

    @Query("""
        SELECT c FROM LearningCourse c
        WHERE c.status = 'PUBLISHED'
          AND c.mentorId IN :mentorIds
        ORDER BY c.publishedAt DESC
        """)
    Page<LearningCourse> findPublishedByMentorIds(@Param("mentorIds") List<UUID> mentorIds, Pageable pageable);

    @Query("""
        SELECT c FROM LearningCourse c
        WHERE c.status = 'PUBLISHED'
          AND (:pricingType IS NULL OR c.pricingType = :pricingType)
          AND (:difficulty IS NULL OR c.difficulty = :difficulty)
          AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(c.tags) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY c.publishedAt DESC
        """)
    Page<LearningCourse> searchPublished(
        @Param("pricingType") String pricingType,
        @Param("difficulty") String difficulty,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("""
        SELECT c FROM LearningCourse c
        WHERE c.status = 'PUBLISHED'
        ORDER BY c.enrolledCount DESC, c.averageRating DESC
        """)
    Page<LearningCourse> findTrending(Pageable pageable);

    long countByMentorIdAndStatus(UUID mentorId, String status);
    long countByMentorId(UUID mentorId);
}
