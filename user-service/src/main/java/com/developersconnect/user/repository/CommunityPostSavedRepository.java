package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostSaved;
import com.developersconnect.user.model.CommunityPostSaved.SavedId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostSavedRepository extends JpaRepository<CommunityPostSaved, SavedId> {

    boolean existsByPostIdAndUserId(java.util.UUID postId, java.util.UUID userId);

    void deleteByPostIdAndUserId(java.util.UUID postId, java.util.UUID userId);
}
