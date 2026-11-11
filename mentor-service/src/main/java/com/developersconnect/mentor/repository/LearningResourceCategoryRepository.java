package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.LearningResourceCategory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningResourceCategoryRepository extends JpaRepository<LearningResourceCategory, UUID> {
    boolean existsByNameIgnoreCase(String name);
}
