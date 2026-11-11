package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mentorship_bookings")
public class MentorshipBooking {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String bookingCode;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false)
    private UUID learnerId;

    @Column(nullable = false, length = 200)
    private String mentorDisplayName;

    @Column(nullable = false, length = 64)
    private String learnerDisplayName;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    private int durationMinutes = 60;

    @Column(nullable = false)
    private int hourlyRateCents;

    @Column(nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 32)
    private String status = "pending";

    @Column(nullable = false, length = 32)
    private String refundStatus = "none";

    @Column(length = 1000)
    private String notes;

    @Column(length = 32)
    private String requestType;

    @Column(length = 1000)
    private String requestMessage;

    @Column(nullable = false)
    private boolean premiumLearner = false;

    @Column(length = 64)
    private String scheduledAtZone = "UTC";

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant cancelledAt;

    private Instant completedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getBookingCode() {
        return bookingCode;
    }

    public void setBookingCode(String bookingCode) {
        this.bookingCode = bookingCode;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public UUID getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(UUID learnerId) {
        this.learnerId = learnerId;
    }

    public String getMentorDisplayName() {
        return mentorDisplayName;
    }

    public void setMentorDisplayName(String mentorDisplayName) {
        this.mentorDisplayName = mentorDisplayName;
    }

    public String getLearnerDisplayName() {
        return learnerDisplayName;
    }

    public void setLearnerDisplayName(String learnerDisplayName) {
        this.learnerDisplayName = learnerDisplayName;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public int getHourlyRateCents() {
        return hourlyRateCents;
    }

    public void setHourlyRateCents(int hourlyRateCents) {
        this.hourlyRateCents = hourlyRateCents;
    }

    public int getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(int amountCents) {
        this.amountCents = amountCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRefundStatus() {
        return refundStatus;
    }

    public void setRefundStatus(String refundStatus) {
        this.refundStatus = refundStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

    public boolean isPremiumLearner() {
        return premiumLearner;
    }

    public void setPremiumLearner(boolean premiumLearner) {
        this.premiumLearner = premiumLearner;
    }

    public String getScheduledAtZone() {
        return scheduledAtZone;
    }

    public void setScheduledAtZone(String scheduledAtZone) {
        this.scheduledAtZone = scheduledAtZone;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
