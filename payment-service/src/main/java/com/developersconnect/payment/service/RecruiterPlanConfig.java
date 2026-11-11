package com.developersconnect.payment.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;

import com.developersconnect.payment.model.RecruiterPlanType;

public final class RecruiterPlanConfig {

    public static final int UNLIMITED = -1;

    private RecruiterPlanConfig() {}

    public record PlanLimits(
        int activeJobLimit,
        int candidateSearchLimit,
        int messageLimit,
        int recruiterSeatLimit,
        int aiReportLimit,
        long priceCents,
        String displayName
    ) {}

    public static PlanLimits limitsFor(RecruiterPlanType planType) {
        return switch (planType) {
            case FREE -> new PlanLimits(2, 20, 20, 1, 0, 0L, "Free");
            case PRO -> new PlanLimits(20, 1000, UNLIMITED, 5, 200, 499_900L, "Pro Recruiter");
            case ENTERPRISE -> new PlanLimits(UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED, 0L, "Enterprise");
        };
    }

    public static BigDecimal priceInr(RecruiterPlanType planType) {
        PlanLimits limits = limitsFor(planType);
        return BigDecimal.valueOf(limits.priceCents()).movePointLeft(2);
    }

    public static Instant defaultExpiry(RecruiterPlanType planType, Instant from) {
        if (planType == RecruiterPlanType.FREE) {
            return null;
        }
        return from.plus(365, ChronoUnit.DAYS);
    }

    public static java.util.Set<String> enabledFeatures(RecruiterPlanType planType) {
        return switch (planType) {
            case FREE -> java.util.Set.of("BASIC_PROFILE", "BASIC_ANALYTICS");
            case PRO -> java.util.Set.of(
                "BASIC_PROFILE",
                "FULL_PROFILE",
                "DEV_SCORE",
                "AI_MATCH",
                "MENTOR_REVIEWS",
                "RESUME_DOWNLOAD",
                "TALENT_POOL",
                "INTERVIEW_SCHEDULING",
                "ANALYTICS",
                "ADVANCED_ANALYTICS",
                "PRIORITY_CANDIDATES",
                "AI_REPORTS"
            );
            case ENTERPRISE -> java.util.Set.of(
                "BASIC_PROFILE",
                "FULL_PROFILE",
                "DEV_SCORE",
                "AI_MATCH",
                "MENTOR_REVIEWS",
                "RESUME_DOWNLOAD",
                "TALENT_POOL",
                "INTERVIEW_SCHEDULING",
                "ANALYTICS",
                "ADVANCED_ANALYTICS",
                "PRIORITY_CANDIDATES",
                "AI_REPORTS",
                "API_ACCESS",
                "COMPANY_BRANDING",
                "CUSTOM_PIPELINE",
                "BULK_EXPORT",
                "DEDICATED_SUPPORT"
            );
        };
    }

    public static Map<String, Boolean> featureMap(RecruiterPlanType planType) {
        java.util.Set<String> enabled = enabledFeatures(planType);
        return Map.ofEntries(
            Map.entry("basicProfile", enabled.contains("BASIC_PROFILE")),
            Map.entry("fullProfile", enabled.contains("FULL_PROFILE")),
            Map.entry("devScore", enabled.contains("DEV_SCORE")),
            Map.entry("aiMatch", enabled.contains("AI_MATCH")),
            Map.entry("mentorReviews", enabled.contains("MENTOR_REVIEWS")),
            Map.entry("resumeDownload", enabled.contains("RESUME_DOWNLOAD")),
            Map.entry("talentPool", enabled.contains("TALENT_POOL")),
            Map.entry("interviewScheduling", enabled.contains("INTERVIEW_SCHEDULING")),
            Map.entry("analytics", enabled.contains("ANALYTICS")),
            Map.entry("advancedAnalytics", enabled.contains("ADVANCED_ANALYTICS")),
            Map.entry("priorityCandidates", enabled.contains("PRIORITY_CANDIDATES")),
            Map.entry("aiReports", enabled.contains("AI_REPORTS")),
            Map.entry("apiAccess", enabled.contains("API_ACCESS")),
            Map.entry("companyBranding", enabled.contains("COMPANY_BRANDING")),
            Map.entry("customPipeline", enabled.contains("CUSTOM_PIPELINE")),
            Map.entry("bulkExport", enabled.contains("BULK_EXPORT")),
            Map.entry("dedicatedSupport", enabled.contains("DEDICATED_SUPPORT"))
        );
    }

    public static boolean isUnlimited(int limit) {
        return limit == UNLIMITED;
    }

    public static boolean hasFeature(RecruiterPlanType planType, String feature) {
        String normalized = feature.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        return switch (normalized) {
            case "DEV_SCORE", "DEVSCORE" -> enabledFeatures(planType).contains("DEV_SCORE");
            case "AI_MATCH", "AIMATCH" -> enabledFeatures(planType).contains("AI_MATCH");
            case "MENTOR_REVIEWS", "MENTORREVIEWS" -> enabledFeatures(planType).contains("MENTOR_REVIEWS");
            case "RESUME_DOWNLOAD", "RESUMEDOWNLOAD" -> enabledFeatures(planType).contains("RESUME_DOWNLOAD");
            case "TALENT_POOL", "TALENTPOOL" -> enabledFeatures(planType).contains("TALENT_POOL");
            case "ADVANCED_ANALYTICS", "ADVANCEDANALYTICS" -> enabledFeatures(planType).contains("ADVANCED_ANALYTICS");
            case "AI_REPORTS", "AIREPORTS" -> enabledFeatures(planType).contains("AI_REPORTS");
            case "PRIORITY_CANDIDATES", "PRIORITYCANDIDATES" -> enabledFeatures(planType).contains("PRIORITY_CANDIDATES");
            default -> enabledFeatures(planType).contains(normalized);
        };
    }
}
