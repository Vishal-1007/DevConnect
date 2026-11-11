package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.SavedLearningResource;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedLearningResourceRepository extends JpaRepository<SavedLearningResource, SavedLearningResource.Id> {
    boolean existsByIdLearnerIdAndIdResourceId(UUID learnerId, UUID resourceId);
    void deleteByIdLearnerIdAndIdResourceId(UUID learnerId, UUID resourceId);
}
