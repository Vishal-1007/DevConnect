package com.developersconnect.notification.repository;

import com.developersconnect.notification.model.PlatformNotification;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformNotificationRepository extends JpaRepository<PlatformNotification, UUID> {
}
