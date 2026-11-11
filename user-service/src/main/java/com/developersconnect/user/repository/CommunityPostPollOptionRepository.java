package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostPollOption;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostPollOptionRepository extends JpaRepository<CommunityPostPollOption, UUID> {
    List<CommunityPostPollOption> findByPollIdOrderBySortOrderAsc(UUID pollId);
}
