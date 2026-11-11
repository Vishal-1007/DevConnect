package com.developersconnect.user.service;

import com.developersconnect.user.dto.FeatureFlagResponse;
import com.developersconnect.user.dto.FeatureFlagsOverviewResponse;
import com.developersconnect.user.model.PlatformFeatureFlag;
import com.developersconnect.user.repository.PlatformFeatureFlagRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminFeatureService {

    private static final List<DefaultFeature> DEFAULTS = List.of(
        new DefaultFeature("aiMatching", "AI Matching", "Intelligent skill-based user matching algorithm", "Core", true, false),
        new DefaultFeature("videoRooms", "Video Rooms", "WebRTC-powered live video sessions", "Core", true, true),
        new DefaultFeature("mentorship", "Mentorship System", "Mentor applications, sessions and bookings", "Core", true, true),
        new DefaultFeature("payments", "Payments", "Stripe-powered session payments and billing", "Core", true, true),
        new DefaultFeature("communityFeed", "Community Feed", "Social posts, likes and comments", "Community", true, false),
        new DefaultFeature("discussions", "Discussions Forum", "Q&A threads and knowledge sharing", "Community", true, false),
        new DefaultFeature("events", "Events", "Platform events and workshops", "Community", true, false),
        new DefaultFeature("webinars", "Webinars", "Live webinars, streaming and recordings", "Community", true, false),
        new DefaultFeature("leaderboard", "Leaderboard", "User rankings and gamification", "Community", true, false),
        new DefaultFeature("notifications", "Push Notifications", "In-app and email notification delivery", "System", true, false),
        new DefaultFeature("rateLimit", "API Rate Limiting", "Protect APIs from abuse and DDoS", "System", true, true),
        new DefaultFeature("codeReview", "Code Review", "Peer code review and collaboration tools", "Learning", true, false),
        new DefaultFeature("pairProgramming", "Pair Programming", "Real-time collaborative coding sessions", "Learning", true, false),
        new DefaultFeature("mockInterviews", "Mock Interviews", "Simulated technical interview practice", "Learning", true, false),
        new DefaultFeature("analytics", "Advanced Analytics", "Business intelligence and reporting dashboard", "Admin", true, false),
        new DefaultFeature("proAdminToolkit", "Pro Admin Toolkit", "Advanced analytics, AI moderation and fraud detection", "Admin", false, false),
        new DefaultFeature("maintenanceMode", "Maintenance Mode", "Temporarily suspend all user-facing features", "Admin", false, true)
    );

    private final PlatformFeatureFlagRepository featureRepository;
    private final SystemLogService systemLogService;

    public AdminFeatureService(
        PlatformFeatureFlagRepository featureRepository,
        SystemLogService systemLogService
    ) {
        this.featureRepository = featureRepository;
        this.systemLogService = systemLogService;
    }

    @Transactional(readOnly = true)
    public FeatureFlagsOverviewResponse getOverview() {
        List<FeatureFlagResponse> features = featureRepository.findAllByOrderByCategoryAscLabelAsc()
            .stream()
            .map(this::toResponse)
            .toList();
        Map<String, Boolean> flags = new LinkedHashMap<>();
        features.forEach(f -> flags.put(f.key(), f.enabled()));
        return new FeatureFlagsOverviewResponse(
            features,
            (int) featureRepository.countByEnabledTrue(),
            features.size(),
            flags
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> getPublicFlags() {
        Map<String, Boolean> flags = new LinkedHashMap<>();
        featureRepository.findAllByOrderByCategoryAscLabelAsc()
            .forEach(f -> flags.put(f.getFeatureKey(), f.isEnabled()));
        return flags;
    }

    @Transactional(readOnly = true)
    public boolean isEnabled(String key) {
        return featureRepository.findById(key)
            .map(PlatformFeatureFlag::isEnabled)
            .orElse(true);
    }

    @Transactional
    public FeatureFlagResponse toggleFeature(String key, boolean enabled, String adminUsername) {
        PlatformFeatureFlag feature = featureRepository.findById(key)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found: " + key));

        boolean previous = feature.isEnabled();
        feature.setEnabled(enabled);
        feature.setUpdatedByUsername(adminUsername);
        feature.setUpdatedAt(Instant.now());
        FeatureFlagResponse response = toResponse(featureRepository.save(feature));

        systemLogService.record(
            "info",
            "user-service",
            "general",
            "Feature '" + feature.getLabel() + "' " + (enabled ? "enabled" : "disabled") + " by " + adminUsername,
            "key=" + key + " previous=" + previous
        );

        return response;
    }

    @Transactional
    public void ensureDefaults() {
        if (featureRepository.count() > 0) {
            return;
        }
        Instant now = Instant.now();
        for (DefaultFeature def : DEFAULTS) {
            PlatformFeatureFlag flag = new PlatformFeatureFlag();
            flag.setFeatureKey(def.key());
            flag.setLabel(def.label());
            flag.setDescription(def.description());
            flag.setCategory(def.category());
            flag.setEnabled(def.enabled());
            flag.setCritical(def.critical());
            flag.setUpdatedAt(now);
            featureRepository.save(flag);
        }
    }

    private FeatureFlagResponse toResponse(PlatformFeatureFlag feature) {
        return new FeatureFlagResponse(
            feature.getFeatureKey(),
            feature.getLabel(),
            feature.getDescription(),
            feature.getCategory(),
            feature.isEnabled(),
            feature.isCritical(),
            Optional.ofNullable(feature.getUpdatedByUsername()).orElse("system"),
            feature.getUpdatedAt()
        );
    }

    private record DefaultFeature(
        String key,
        String label,
        String description,
        String category,
        boolean enabled,
        boolean critical
    ) {}
}
