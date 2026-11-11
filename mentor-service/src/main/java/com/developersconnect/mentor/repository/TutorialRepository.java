package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.Tutorial;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TutorialRepository extends JpaRepository<Tutorial, UUID> {
    List<Tutorial> findByCreatorTypeAndStatusOrderByUpdatedAtDesc(String creatorType, String status);
    List<Tutorial> findByCreatedByOrderByUpdatedAtDesc(UUID createdBy);
    List<Tutorial> findByStatusOrderByUpdatedAtDesc(String status);

    @Query("""
        SELECT t FROM Tutorial t
        WHERE t.status = 'PUBLISHED'
        AND (:creatorType IS NULL OR t.creatorType = :creatorType)
        AND (:category IS NULL OR LOWER(t.category) = LOWER(:category))
        AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY t.updatedAt DESC
        """)
    List<Tutorial> searchPublished(
        @Param("creatorType") String creatorType,
        @Param("category") String category,
        @Param("search") String search
    );
}
