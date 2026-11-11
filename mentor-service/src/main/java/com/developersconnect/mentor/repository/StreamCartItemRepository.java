package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.StreamCartItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreamCartItemRepository extends JpaRepository<StreamCartItem, UUID> {
    List<StreamCartItem> findByLearnerIdOrderByAddedAtDesc(UUID learnerId);
    Optional<StreamCartItem> findByLearnerIdAndCourseId(UUID learnerId, UUID courseId);
    void deleteByLearnerIdAndCourseId(UUID learnerId, UUID courseId);
}
