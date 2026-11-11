package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.RecruiterIntegrationSyncSettingsResponse;
import com.developersconnect.payment.model.RecruiterIntegration;
import com.developersconnect.payment.model.RecruiterIntegrationProvider;
import com.developersconnect.payment.repository.RecruiterIntegrationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RecruiterIntegrationSyncSettingsService {

    private final RecruiterIntegrationRepository repository;
    private final ObjectMapper objectMapper;

    public RecruiterIntegrationSyncSettingsService(
        RecruiterIntegrationRepository repository,
        ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public RecruiterIntegrationSyncSettingsResponse getSyncSettings(
        UUID recruiterId,
        RecruiterIntegrationProvider provider
    ) {
        RecruiterIntegration integration = requireConnectedIntegration(recruiterId, provider);
        return new RecruiterIntegrationSyncSettingsResponse(
            provider.name(),
            readSettings(integration, provider)
        );
    }

    @Transactional
    public RecruiterIntegrationSyncSettingsResponse updateSyncSettings(
        UUID recruiterId,
        RecruiterIntegrationProvider provider,
        Map<String, Object> settings
    ) {
        RecruiterIntegration integration = requireConnectedIntegration(recruiterId, provider);
        Map<String, Object> merged = mergeWithDefaults(provider, settings);
        integration.setSyncSettingsJson(writeJson(merged));
        integration.setLastSyncAt(Instant.now());
        repository.save(integration);
        return new RecruiterIntegrationSyncSettingsResponse(provider.name(), merged);
    }

    public Map<String, Object> defaultSettings(RecruiterIntegrationProvider provider) {
        return switch (provider) {
            case GOOGLE_CALENDAR -> googleCalendarDefaults();
            case ZOOM -> zoomDefaults();
            case MICROSOFT_TEAMS -> teamsDefaults();
        };
    }

    private RecruiterIntegration requireConnectedIntegration(
        UUID recruiterId,
        RecruiterIntegrationProvider provider
    ) {
        RecruiterIntegration integration = repository
            .findByRecruiterIdAndProvider(recruiterId, provider)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Integration not found"));

        if (!integration.isConnected()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Integration is not connected");
        }
        return integration;
    }

    private Map<String, Object> readSettings(
        RecruiterIntegration integration,
        RecruiterIntegrationProvider provider
    ) {
        if (integration.getSyncSettingsJson() == null || integration.getSyncSettingsJson().isBlank()) {
            return defaultSettings(provider);
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(
                integration.getSyncSettingsJson(),
                new TypeReference<Map<String, Object>>() {}
            );
            return mergeWithDefaults(provider, parsed);
        } catch (JsonProcessingException ex) {
            return defaultSettings(provider);
        }
    }

    private Map<String, Object> mergeWithDefaults(
        RecruiterIntegrationProvider provider,
        Map<String, Object> incoming
    ) {
        Map<String, Object> merged = new LinkedHashMap<>(defaultSettings(provider));
        if (incoming != null) {
            merged.putAll(incoming);
        }
        return merged;
    }

    private String writeJson(Map<String, Object> settings) {
        try {
            return objectMapper.writeValueAsString(settings);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sync settings payload");
        }
    }

    private Map<String, Object> googleCalendarDefaults() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("autoCreateEvents", true);
        settings.put("sendCandidateInvite", true);
        settings.put("attachMeetingLinks", true);
        settings.put("syncUpdates", true);
        settings.put("removeCancelledEvents", true);
        settings.put("reminderTime", "30_MINUTES");
        settings.put("workingStart", "09:00");
        settings.put("workingEnd", "18:00");
        return settings;
    }

    private Map<String, Object> zoomDefaults() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("autoCreateMeeting", true);
        settings.put("addLinkToInterview", true);
        settings.put("enableWaitingRoom", true);
        settings.put("enableMeetingPassword", true);
        settings.put("enableRecording", false);
        settings.put("defaultDurationMinutes", 45);
        return settings;
    }

    private Map<String, Object> teamsDefaults() {
        Map<String, Object> settings = new LinkedHashMap<>();
        settings.put("createMeetingAutomatically", true);
        settings.put("addCandidateToMeeting", true);
        settings.put("sendTeamsInvitation", true);
        settings.put("notifyRecruiterTeam", true);
        settings.put("syncMeetingUpdates", true);
        return settings;
    }
}
