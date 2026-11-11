package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostPoll;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostPollRepository extends JpaRepository<CommunityPostPoll, UUID> {
    Optional<CommunityPostPoll> findByPostId(UUID postId);
}
