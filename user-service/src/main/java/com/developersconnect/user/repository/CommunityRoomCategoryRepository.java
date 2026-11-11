package com.developersconnect.user.repository;

import com.developersconnect.user.model.CommunityRoomCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityRoomCategoryRepository extends JpaRepository<CommunityRoomCategory, UUID> {

    List<CommunityRoomCategory> findAllByOrderByDisplayOrderAscLabelAsc();

    List<CommunityRoomCategory> findAllByActiveTrueOrderByDisplayOrderAscLabelAsc();

    Optional<CommunityRoomCategory> findBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, UUID id);
}
