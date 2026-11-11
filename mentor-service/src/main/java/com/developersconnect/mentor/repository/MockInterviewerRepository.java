package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MockInterviewer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MockInterviewerRepository extends JpaRepository<MockInterviewer, UUID> {

    Optional<MockInterviewer> findByUserId(UUID userId);

    List<MockInterviewer> findByStatusOrderByRatingDesc(String status);

    @Query("""
        SELECT i FROM MockInterviewer i
        WHERE i.status = :status
        AND (:onlineOnly = false OR i.online = true)
        AND (:minRating IS NULL OR i.rating >= :minRating)
        AND (:maxPrice IS NULL OR i.hourlyRateCents <= :maxPrice)
        AND (:minPrice IS NULL OR i.hourlyRateCents >= :minPrice)
        AND (
            :search IS NULL OR :search = '' OR
            LOWER(i.headline) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(i.company) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(i.skills) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            :category IS NULL OR :category = '' OR
            LOWER(i.skills) LIKE LOWER(CONCAT('%', :category, '%'))
        )
        ORDER BY i.rating DESC, i.totalInterviews DESC
        """)
    List<MockInterviewer> searchActive(
        @Param("status") String status,
        @Param("search") String search,
        @Param("category") String category,
        @Param("onlineOnly") boolean onlineOnly,
        @Param("minRating") Double minRating,
        @Param("minPrice") Integer minPrice,
        @Param("maxPrice") Integer maxPrice
    );
}
