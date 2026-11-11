package com.developersconnect.notification.repository;

import com.developersconnect.notification.model.Notification;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    long countByUserId(UUID userId);

    long countByUserIdAndReadAtIsNullAndDeletedAtIsNull(UUID userId);

    long countByDeletedAtIsNull();

    long countByReadAtIsNotNullAndDeletedAtIsNull();

    long countByReadAtIsNullAndDeletedAtIsNull();

    List<Notification> findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(
        UUID userId,
        Pageable pageable
    );

    @Query(
        "SELECT n FROM Notification n "
            + "WHERE n.userId = :userId AND n.deletedAt IS NULL "
            + "AND ("
            + ":filter = 'all' "
            + "OR (:filter = 'unread' AND n.readAt IS NULL) "
            + "OR (:filter = 'read' AND n.readAt IS NOT NULL)"
            + ") "
            + "ORDER BY n.createdAt DESC"
    )
    List<Notification> findForUser(
        @Param("userId") UUID userId,
        @Param("filter") String filter,
        Pageable pageable
    );

    @Modifying(clearAutomatically = true)
    @Query(
        "UPDATE Notification n SET n.readAt = :now "
            + "WHERE n.userId = :userId AND n.readAt IS NULL AND n.deletedAt IS NULL"
    )
    int markAllReadForUser(@Param("userId") UUID userId, @Param("now") Instant now);
}
