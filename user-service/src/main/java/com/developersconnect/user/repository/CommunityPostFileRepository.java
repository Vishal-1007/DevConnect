package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityPostFile;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostFileRepository extends JpaRepository<CommunityPostFile, UUID> {
}
