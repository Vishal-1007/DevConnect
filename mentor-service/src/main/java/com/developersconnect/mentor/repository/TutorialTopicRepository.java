package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TutorialTopic;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorialTopicRepository extends JpaRepository<TutorialTopic, UUID> {
    List<TutorialTopic> findBySectionIdOrderByOrderIndexAsc(UUID sectionId);
    List<TutorialTopic> findByTutorialIdOrderByOrderIndexAsc(UUID tutorialId);
    void deleteByTutorialId(UUID tutorialId);
    void deleteBySectionId(UUID sectionId);
    long countByTutorialId(UUID tutorialId);
}
