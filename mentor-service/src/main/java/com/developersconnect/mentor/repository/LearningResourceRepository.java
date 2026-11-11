package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningResource;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningResourceRepository extends JpaRepository<LearningResource, UUID> {

    List<LearningResource> findByVisibilityOrderByCreatedAtDesc(String visibility);

    @Query("""
        SELECT r FROM LearningResource r
        WHERE (:visibility IS NULL OR r.visibility = :visibility)
          AND (:categoryId IS NULL OR r.categoryId = :categoryId)
          AND (:q IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY r.createdAt DESC
        """)
    List<LearningResource> search(
        @Param("visibility") String visibility,
        @Param("categoryId") UUID categoryId,
        @Param("q") String q
    );

    long countByVisibility(String visibility);
}
