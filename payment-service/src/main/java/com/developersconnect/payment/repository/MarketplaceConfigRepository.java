package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.MarketplaceConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceConfigRepository extends JpaRepository<MarketplaceConfig, String> {
}
