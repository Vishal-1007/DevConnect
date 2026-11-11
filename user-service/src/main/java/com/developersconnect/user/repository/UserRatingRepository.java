package com.developersconnect.user.repository;

import com.developersconnect.user.model.UserRating;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRatingRepository extends JpaRepository<UserRating, UUID> {

    Optional<UserRating> findByRatedUserIdAndRaterUserId(UUID ratedUserId, UUID raterUserId);

    @Query("select coalesce(avg(r.score), 0) from UserRating r where r.ratedUserId = :userId")
    double averageScore(@Param("userId") UUID userId);

    long countByRatedUserId(UUID ratedUserId);
}
