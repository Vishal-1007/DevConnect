package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorApplication;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorApplicationRepository extends JpaRepository<MentorApplication, UUID> {

    Optional<MentorApplication> findByUserId(UUID userId);

    List<MentorApplication> findAllByOrderByCreatedAtDesc();

    List<MentorApplication> findAllByStatusOrderByCreatedAtDesc(MentorApplication.Status status);
}
