package com.developersconnect.user.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.user.model.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUsername(String username);

    @Query("SELECT COUNT(u) FROM UserProfile u WHERE u.updatedAt > :after")
    long countByUpdatedAtAfter(@Param("after") Instant after);

    @Query("SELECT COUNT(u) FROM UserProfile u WHERE u.createdAt < :before")
    long countByCreatedAtBefore(@Param("before") Instant before);

    @Query("SELECT COUNT(u) FROM UserProfile u WHERE LOWER(u.role) LIKE LOWER(CONCAT('%', :role, '%'))")
    long countByRoleIgnoreCaseContaining(@Param("role") String role);

    @Query("SELECT u.id FROM UserProfile u")
    List<UUID> findAllAccountIds();

    @Query("SELECT u.id FROM UserProfile u WHERE LOWER(u.role) LIKE LOWER(CONCAT('%', :role, '%'))")
    List<UUID> findAccountIdsByRoleContaining(@Param("role") String role);

    @Query("SELECT u.id FROM UserProfile u WHERE u.updatedAt > :after")
    List<UUID> findAccountIdsByUpdatedAtAfter(@Param("after") Instant after);
}
