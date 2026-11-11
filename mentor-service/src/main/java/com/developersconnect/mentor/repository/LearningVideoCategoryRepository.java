package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningVideoCategory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningVideoCategoryRepository extends JpaRepository<LearningVideoCategory, UUID> {
    boolean existsByNameIgnoreCase(String name);
}
