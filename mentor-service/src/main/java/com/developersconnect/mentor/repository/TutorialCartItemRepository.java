package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TutorialCartItem;
import com.developersconnect.mentor.model.TutorialCartItem.CartId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorialCartItemRepository extends JpaRepository<TutorialCartItem, CartId> {
    List<TutorialCartItem> findByUserId(UUID userId);
    boolean existsByUserIdAndTutorialId(UUID userId, UUID tutorialId);
    void deleteByUserIdAndTutorialId(UUID userId, UUID tutorialId);
}
