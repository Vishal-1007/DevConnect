package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.RecruiterOAuthState;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RecruiterOAuthStateRepository extends JpaRepository<RecruiterOAuthState, UUID> {

    Optional<RecruiterOAuthState> findByStateToken(String stateToken);

    @Modifying
    @Query("DELETE FROM RecruiterOAuthState s WHERE s.expiresAt < CURRENT_TIMESTAMP")
    int deleteExpired();
}
