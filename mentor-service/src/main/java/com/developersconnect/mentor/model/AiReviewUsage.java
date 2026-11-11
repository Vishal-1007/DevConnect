package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "ai_review_usage",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "review_date"})
)
public class AiReviewUsage {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Column(name = "free_reviews_used", nullable = false)
    private int freeReviewsUsed = 0;

    @Column(name = "paid_reviews_available", nullable = false)
    private int paidReviewsAvailable = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate reviewDate) { this.reviewDate = reviewDate; }
    public int getFreeReviewsUsed() { return freeReviewsUsed; }
    public void setFreeReviewsUsed(int freeReviewsUsed) { this.freeReviewsUsed = freeReviewsUsed; }
    public int getPaidReviewsAvailable() { return paidReviewsAvailable; }
    public void setPaidReviewsAvailable(int paidReviewsAvailable) { this.paidReviewsAvailable = paidReviewsAvailable; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
