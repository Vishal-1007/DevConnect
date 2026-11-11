package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningVideo;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LearningVideoRepository extends JpaRepository<LearningVideo, UUID> {

    List<LearningVideo> findByVisibilityOrderByCreatedAtDesc(String visibility);

    @Query("""
        SELECT v FROM LearningVideo v
        WHERE (:visibility IS NULL OR v.visibility = :visibility)
          AND (:categoryId IS NULL OR v.categoryId = :categoryId)
          AND (:q IS NULL OR LOWER(v.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(v.description) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY v.createdAt DESC
        """)
    List<LearningVideo> search(
        @Param("visibility") String visibility,
        @Param("categoryId") UUID categoryId,
        @Param("q") String q
    );

    @Query("SELECT v FROM LearningVideo v WHERE v.visibility = 'PUBLIC' ORDER BY v.viewCount DESC")
    List<LearningVideo> findTrending();

    long countByVisibility(String visibility);
}
