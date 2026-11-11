package com.developersconnect.mentor.dto;

import java.util.UUID;

public final class MockInterviewRequestResponse {

    private final UUID id;
    private final UUID learnerId;
    private final String learnerName;
    private final UUID interviewerId;
    private final String interviewerName;
    private final String interviewerPicture;
    private final String interviewType;
    private final String difficulty;
    private final String focusTopic;
    private final String message;
    private final String status;
    private final String scheduledAt;
    private final String slotEndAt;
    private final Integer durationMinutes;
    private final Integer amountCents;
    private final Integer platformFeeCents;
    private final String paymentStatus;
    private final String sessionCode;
    private final String createdAt;
    private final String updatedAt;

    public MockInterviewRequestResponse(
        UUID id,
        UUID learnerId,
        String learnerName,
        UUID interviewerId,
        String interviewerName,
        String interviewerPicture,
        String interviewType,
        String difficulty,
        String focusTopic,
        String message,
        String status,
        String scheduledAt,
        String slotEndAt,
        Integer durationMinutes,
        Integer amountCents,
        Integer platformFeeCents,
        String paymentStatus,
        String sessionCode,
        String createdAt,
        String updatedAt
    ) {
        this.id = id;
        this.learnerId = learnerId;
        this.learnerName = learnerName;
        this.interviewerId = interviewerId;
        this.interviewerName = interviewerName;
        this.interviewerPicture = interviewerPicture;
        this.interviewType = interviewType;
        this.difficulty = difficulty;
        this.focusTopic = focusTopic;
        this.message = message;
        this.status = status;
        this.scheduledAt = scheduledAt;
        this.slotEndAt = slotEndAt;
        this.durationMinutes = durationMinutes;
        this.amountCents = amountCents;
        this.platformFeeCents = platformFeeCents;
        this.paymentStatus = paymentStatus;
        this.sessionCode = sessionCode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID id() { return id; }
    public UUID learnerId() { return learnerId; }
    public String learnerName() { return learnerName; }
    public UUID interviewerId() { return interviewerId; }
    public String interviewerName() { return interviewerName; }
    public String interviewerPicture() { return interviewerPicture; }
    public String interviewType() { return interviewType; }
    public String difficulty() { return difficulty; }
    public String focusTopic() { return focusTopic; }
    public String message() { return message; }
    public String status() { return status; }
    public String scheduledAt() { return scheduledAt; }
    public String slotEndAt() { return slotEndAt; }
    public Integer durationMinutes() { return durationMinutes; }
    public Integer amountCents() { return amountCents; }
    public Integer platformFeeCents() { return platformFeeCents; }
    public String paymentStatus() { return paymentStatus; }
    public String sessionCode() { return sessionCode; }
    public String createdAt() { return createdAt; }
    public String updatedAt() { return updatedAt; }
}
