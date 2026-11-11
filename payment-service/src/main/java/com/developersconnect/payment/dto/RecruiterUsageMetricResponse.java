package com.developersconnect.payment.dto;

public class RecruiterUsageMetricResponse {

    private final String id;
    private final String label;
    private final int used;
    private final int limit;
    private final String displayLimit;

    public RecruiterUsageMetricResponse(
        String id,
        String label,
        int used,
        int limit,
        String displayLimit
    ) {
        this.id = id;
        this.label = label;
        this.used = used;
        this.limit = limit;
        this.displayLimit = displayLimit;
    }

    public String getId() {
        return id;
    }

    public String getLabel() {
        return label;
    }

    public int getUsed() {
        return used;
    }

    public int getLimit() {
        return limit;
    }

    public String getDisplayLimit() {
        return displayLimit;
    }
}
