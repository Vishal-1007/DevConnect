package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mentor_wallets")
public class MentorWallet {

    @Id
    @Column(name = "mentor_id")
    private UUID mentorId;

    @Column(name = "available_balance_cents", nullable = false)
    private int availableBalanceCents;

    @Column(name = "total_earning_cents", nullable = false)
    private int totalEarningCents;

    @Column(name = "withdrawn_amount_cents", nullable = false)
    private int withdrawnAmountCents;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public UUID getMentorId() {
        return mentorId;
    }

    public void setMentorId(UUID mentorId) {
        this.mentorId = mentorId;
    }

    public int getAvailableBalanceCents() {
        return availableBalanceCents;
    }

    public void setAvailableBalanceCents(int availableBalanceCents) {
        this.availableBalanceCents = availableBalanceCents;
    }

    public int getTotalEarningCents() {
        return totalEarningCents;
    }

    public void setTotalEarningCents(int totalEarningCents) {
        this.totalEarningCents = totalEarningCents;
    }

    public int getWithdrawnAmountCents() {
        return withdrawnAmountCents;
    }

    public void setWithdrawnAmountCents(int withdrawnAmountCents) {
        this.withdrawnAmountCents = withdrawnAmountCents;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
