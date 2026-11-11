package com.developersconnect.payment.service;

import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.model.RecruiterOAuthState;
import com.developersconnect.payment.repository.RecruiterOAuthStateRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecruiterOAuthStateService {

    private final RecruiterOAuthStateRepository repository;

    public RecruiterOAuthStateService(RecruiterOAuthStateRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public String createState(UUID recruiterId, RecruiterIntegrationProvider provider) {
        repository.deleteExpired();
        String token = UUID.randomUUID().toString();
        RecruiterOAuthState state = new RecruiterOAuthState();
        state.setStateToken(token);
        state.setRecruiterId(recruiterId);
        state.setProvider(provider);
        state.setExpiresAt(Instant.now().plusSeconds(900));
        repository.save(state);
        return token;
    }

    public boolean isValidState(String stateToken, RecruiterIntegrationProvider provider) {
        if (stateToken == null || stateToken.isBlank()) {
            return false;
        }
        return repository.findByStateToken(stateToken.trim())
            .filter(state -> state.getProvider() == provider)
            .filter(state -> state.getExpiresAt().isAfter(Instant.now()))
            .isPresent();
    }

    public Optional<UUID> findRecruiterId(String stateToken, RecruiterIntegrationProvider provider) {
        if (stateToken == null || stateToken.isBlank()) {
            return Optional.empty();
        }
        return repository.findByStateToken(stateToken.trim())
            .filter(state -> state.getProvider() == provider)
            .filter(state -> state.getExpiresAt().isAfter(Instant.now()))
            .map(RecruiterOAuthState::getRecruiterId);
    }

    @Transactional
    public OAuthStatePayload consumeState(String stateToken) {
        if (stateToken == null || stateToken.isBlank()) {
            return null;
        }
        return repository.findByStateToken(stateToken.trim())
            .filter(state -> state.getExpiresAt().isAfter(Instant.now()))
            .map(state -> {
                repository.delete(state);
                return new OAuthStatePayload(state.getRecruiterId(), state.getProvider());
            })
            .orElse(null);
    }

    public record OAuthStatePayload(UUID recruiterId, RecruiterIntegrationProvider provider) {}
}
