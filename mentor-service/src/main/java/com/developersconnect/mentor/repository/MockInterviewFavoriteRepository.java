package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MockInterviewFavorite;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MockInterviewFavoriteRepository extends JpaRepository<MockInterviewFavorite, UUID> {

    @Query("SELECT f FROM MockInterviewFavorite f WHERE f.learnerId = :learnerId")
    List<MockInterviewFavorite> listByLearnerId(@Param("learnerId") UUID learnerId);

    @Query("""
        SELECT f FROM MockInterviewFavorite f
        WHERE f.learnerId = :learnerId AND f.interviewerUserId = :interviewerUserId
        """)
    Optional<MockInterviewFavorite> findByLearnerAndInterviewer(
        @Param("learnerId") UUID learnerId,
        @Param("interviewerUserId") UUID interviewerUserId
    );
}
