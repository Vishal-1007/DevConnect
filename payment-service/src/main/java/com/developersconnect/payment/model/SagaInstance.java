package com.developersconnect.payment.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "saga_instances")
public class SagaInstance {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID paymentId;

    @Column(nullable = false, length = 64)
    private String sagaType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SagaState state;

    @Column(nullable = false, length = 64)
    private String currentStep;

    @Column(nullable = false)
    private UUID correlationId;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }

    public String getSagaType() {
        return sagaType;
    }

    public void setSagaType(String sagaType) {
        this.sagaType = sagaType;
    }

    public SagaState getState() {
        return state;
    }

    public void setState(SagaState state) {
        this.state = state;
    }

    public String getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(String currentStep) {
        this.currentStep = currentStep;
    }

    public UUID getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(UUID correlationId) {
        this.correlationId = correlationId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
