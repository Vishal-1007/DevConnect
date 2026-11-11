package com.developersconnect.user.repository;

import com.developersconnect.user.model.PlatformFeatureFlag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformFeatureFlagRepository extends JpaRepository<PlatformFeatureFlag, String> {

    List<PlatformFeatureFlag> findAllByOrderByCategoryAscLabelAsc();

    long countByEnabledTrue();
}
