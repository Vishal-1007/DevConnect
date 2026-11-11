package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TutorialSection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorialSectionRepository extends JpaRepository<TutorialSection, UUID> {
    List<TutorialSection> findByTutorialIdOrderByOrderIndexAsc(UUID tutorialId);
    void deleteByTutorialId(UUID tutorialId);
}
