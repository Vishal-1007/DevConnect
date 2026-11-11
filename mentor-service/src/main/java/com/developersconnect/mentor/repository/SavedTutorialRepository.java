package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.SavedTutorial;
import com.developersconnect.mentor.model.SavedTutorial.SavedTutorialId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedTutorialRepository extends JpaRepository<SavedTutorial, SavedTutorialId> {
    List<SavedTutorial> findByUserId(UUID userId);
    boolean existsByUserIdAndTutorialId(UUID userId, UUID tutorialId);
    void deleteByUserIdAndTutorialId(UUID userId, UUID tutorialId);
}
