package com.developersconnect.payment.model;

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
@Table(name = "financial_transactions")
public class FinancialTransaction {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true, length = 16)
    private String transactionCode;

    @Column(nullable = false, length = 32)
    private String transactionType;

    private UUID payerUserId;

    @Column(length = 64)
    private String payerDisplayName;

    private UUID payeeUserId;

    @Column(length = 200)
    private String payeeDisplayName;

    @Column(nullable = false)
    private long amountCents;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Column(nullable = false)
    private long commissionCents;

    @Column(nullable = false)
    private long platformRevenueCents;

    @Column(nullable = false, length = 32)
    private String status;

    private UUID linkedPaymentId;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

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

    public String getTransactionCode() {
        return transactionCode;
    }

    public void setTransactionCode(String transactionCode) {
        this.transactionCode = transactionCode;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public UUID getPayerUserId() {
        return payerUserId;
    }

    public void setPayerUserId(UUID payerUserId) {
        this.payerUserId = payerUserId;
    }

    public String getPayerDisplayName() {
        return payerDisplayName;
    }

    public void setPayerDisplayName(String payerDisplayName) {
        this.payerDisplayName = payerDisplayName;
    }

    public UUID getPayeeUserId() {
        return payeeUserId;
    }

    public void setPayeeUserId(UUID payeeUserId) {
        this.payeeUserId = payeeUserId;
    }

    public String getPayeeDisplayName() {
        return payeeDisplayName;
    }

    public void setPayeeDisplayName(String payeeDisplayName) {
        this.payeeDisplayName = payeeDisplayName;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public long getCommissionCents() {
        return commissionCents;
    }

    public void setCommissionCents(long commissionCents) {
        this.commissionCents = commissionCents;
    }

    public long getPlatformRevenueCents() {
        return platformRevenueCents;
    }

    public void setPlatformRevenueCents(long platformRevenueCents) {
        this.platformRevenueCents = platformRevenueCents;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getLinkedPaymentId() {
        return linkedPaymentId;
    }

    public void setLinkedPaymentId(UUID linkedPaymentId) {
        this.linkedPaymentId = linkedPaymentId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
