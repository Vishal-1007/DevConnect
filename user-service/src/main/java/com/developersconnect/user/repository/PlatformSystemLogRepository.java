package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformSystemLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformSystemLogRepository extends JpaRepository<PlatformSystemLog, UUID> {

    long countByLevel(String level);

    long countByCategory(String category);

    @Query("""
        SELECT l FROM PlatformSystemLog l
        WHERE (:level IS NULL OR l.level = :level)
          AND (:category IS NULL OR l.category = :category)
          AND (:service IS NULL OR l.service = :service)
          AND (
            :query IS NULL OR :query = ''
            OR LOWER(l.message) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(l.details) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(l.service) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY l.createdAt DESC
        """)
    List<PlatformSystemLog> search(
        @Param("level") String level,
        @Param("category") String category,
        @Param("service") String service,
        @Param("query") String query,
        Pageable pageable
    );
}
