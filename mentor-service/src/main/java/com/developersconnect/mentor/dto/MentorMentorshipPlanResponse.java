package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MentorMentorshipPlanResponse(
    UUID id,
    String title,
    String description,
    String planType,
    String planTypeLabel,
    String billingType,
    String billingTypeLabel,
    int priceCents,
    String priceLabel,
    int sessionLimit,
    String sessionLimitLabel,
    int durationMinutes,
    String durationLabel,
    boolean premiumSupport,
    boolean popular,
    boolean active,
    int sortOrder,
    List<String> features
) {}
