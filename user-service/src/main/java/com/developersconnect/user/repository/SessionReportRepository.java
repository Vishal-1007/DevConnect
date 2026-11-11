package com.developersconnect.user.repository;

import com.developersconnect.user.model.SessionReport;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionReportRepository extends JpaRepository<SessionReport, UUID> {

    List<SessionReport> findAllBySessionIdOrderByCreatedAtDesc(UUID sessionId);

    long countBySessionId(UUID sessionId);
}
