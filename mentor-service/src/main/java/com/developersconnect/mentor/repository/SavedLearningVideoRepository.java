package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.SavedLearningVideo;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedLearningVideoRepository extends JpaRepository<SavedLearningVideo, SavedLearningVideo.Id> {
    boolean existsByIdLearnerIdAndIdVideoId(UUID learnerId, UUID videoId);
    void deleteByIdLearnerIdAndIdVideoId(UUID learnerId, UUID videoId);
}
