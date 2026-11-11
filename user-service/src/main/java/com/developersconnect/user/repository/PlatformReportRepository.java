package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformReport;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformReportRepository extends JpaRepository<PlatformReport, UUID> {

    long countByStatus(String status);

    @Query("SELECT r.category, COUNT(r) FROM PlatformReport r GROUP BY r.category")
    List<Object[]> countGroupByCategory();

    @Query("""
        SELECT r FROM PlatformReport r
        WHERE (:status IS NULL OR r.status = :status)
          AND (:category IS NULL OR r.category = :category)
          AND (:targetType IS NULL OR r.targetType = :targetType)
          AND (
            :query IS NULL OR :query = ''
            OR LOWER(r.reportCode) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(r.targetSummary) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(r.reporterUsername) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY r.createdAt DESC
        """)
    List<PlatformReport> search(
        @Param("status") String status,
        @Param("category") String category,
        @Param("targetType") String targetType,
        @Param("query") String query,
        Pageable pageable
    );
}
