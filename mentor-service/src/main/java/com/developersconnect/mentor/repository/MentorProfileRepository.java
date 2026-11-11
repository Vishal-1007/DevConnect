package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorProfile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorProfileRepository extends JpaRepository<MentorProfile, UUID> {

    List<MentorProfile> findAllByAvailableTrueOrderByAverageRatingDesc();

    List<MentorProfile> findByVerifiedTrueAndAvailableTrueOrderByAverageRatingDesc();
}
