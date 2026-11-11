package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "mentor_withdrawal_requests")
public class MentorWithdrawalRequest {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String withdrawalCode;

    @Column(nullable = false)
    private UUID mentorId;

    @Column(nullable = false)
    private long amountCents;

    @Column(nullable = false, length = 32)
    private String status = "pending";

    @Column(length = 500)
    private String note;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant processedAt;

    @PrePersist
    void onCreate() {
        if (requestedAt == null) {
            requestedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public String getWithdrawalCode() {
        return withdrawalCode;
    }

    public void setWithdrawalCode(String withdrawalCode) {
        this.withdrawalCode = withdrawalCode;
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }
}
