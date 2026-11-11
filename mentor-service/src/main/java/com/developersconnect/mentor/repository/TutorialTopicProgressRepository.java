package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TutorialTopicProgress;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorialTopicProgressRepository extends JpaRepository<TutorialTopicProgress, UUID> {
    List<TutorialTopicProgress> findByUserIdAndTutorialId(UUID userId, UUID tutorialId);
    Optional<TutorialTopicProgress> findByUserIdAndTopicId(UUID userId, UUID topicId);
    long countByUserIdAndTutorialIdAndCompletedTrue(UUID userId, UUID tutorialId);
    Optional<TutorialTopicProgress> findFirstByUserIdAndTutorialIdOrderByLastViewedAtDesc(UUID userId, UUID tutorialId);
}
