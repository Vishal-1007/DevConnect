package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.ConnectRecruiterIntegrationRequest;
import com.developersconnect.payment.dto.RecruiterIntegrationResponse;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.developersconnect.payment.security.AuthPrincipal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecruiterIntegrationService {

    private final RecruiterIntegrationRepository repository;
    private final GoogleOAuthService googleOAuthService;

    public RecruiterIntegrationService(
        RecruiterIntegrationRepository repository,
        GoogleOAuthService googleOAuthService
    ) {
        this.repository = repository;
        this.googleOAuthService = googleOAuthService;
    }

    @Transactional(readOnly = true)
    public List<RecruiterIntegrationResponse> listIntegrations(UUID recruiterId) {
        Map<RecruiterIntegrationProvider, RecruiterIntegration> existing = repository.findByRecruiterId(recruiterId)
            .stream()
            .collect(Collectors.toMap(RecruiterIntegration::getProvider, Function.identity()));

        return Arrays.stream(RecruiterIntegrationProvider.values())
            .map(provider -> toResponse(provider, existing.get(provider)))
            .toList();
    }

    @Transactional
    public RecruiterIntegrationResponse connect(
        UUID recruiterId,
        AuthPrincipal principal,
        RecruiterIntegrationProvider provider,
        ConnectRecruiterIntegrationRequest request
    ) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Use OAuth to connect " + providerLabel(provider)
        );
    }

    @Transactional
    public void disconnect(UUID recruiterId, RecruiterIntegrationProvider provider) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, provider)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Integration not found"));

        if (provider == RecruiterIntegrationProvider.GOOGLE_CALENDAR && integration.getAccessToken() != null) {
            googleOAuthService.revokeToken(integration.getAccessToken());
        }

        integration.setConnected(false);
        integration.setAccessToken(null);
        integration.setRefreshToken(null);
        integration.setTokenExpiresAt(null);
        integration.setConnectedEmail(null);
        integration.setConnectedAt(null);
        integration.setLastSyncAt(null);
        integration.setSyncSettingsJson(null);
        repository.save(integration);
    }

    private RecruiterIntegrationResponse toResponse(
        RecruiterIntegrationProvider provider,
        RecruiterIntegration integration
    ) {
        if (integration == null || !integration.isConnected()) {
            return new RecruiterIntegrationResponse(provider.name(), false, null, null, null);
        }
        return new RecruiterIntegrationResponse(
            provider.name(),
            true,
            integration.getConnectedEmail(),
            integration.getConnectedAt(),
            integration.getLastSyncAt()
        );
    }

    private String providerLabel(RecruiterIntegrationProvider provider) {
        return switch (provider) {
            case GOOGLE_CALENDAR -> "Google Calendar";
            case ZOOM -> "Zoom";
            case MICROSOFT_TEAMS -> "Microsoft Teams";
        };
    }
}
