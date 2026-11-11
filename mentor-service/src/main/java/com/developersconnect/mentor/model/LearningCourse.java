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
@Table(name = "learning_courses")
public class LearningCourse {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "mentor_id", nullable = false)
    private UUID mentorId;

    @Column(name = "mentor_display_name", length = 120)
    private String mentorDisplayName;

    @Column(name = "creator_type", nullable = false, length = 16)
    private String creatorType = "MENTOR";

    @Column(length = 64)
    private String category;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "CLOB")
    private String description;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(name = "banner_url", length = 512)
    private String bannerUrl;

    @Column(name = "pricing_type", nullable = false, length = 16)
    private String pricingType = "FREE";

    @Column(name = "price_cents", nullable = false)
    private int priceCents;

    @Column(name = "discount_price_cents")
    private Integer discountPriceCents;

    @Column(nullable = false, length = 16)
    private String difficulty = "BEGINNER";

    @Column(nullable = false, length = 16)
    private String status = "DRAFT";

    @Column(length = 500)
    private String tags;

    @Column(name = "what_you_learn", columnDefinition = "CLOB")
    private String whatYouLearn;

    @Column(columnDefinition = "CLOB")
    private String requirements;

    @Column(name = "average_rating", nullable = false)
    private double averageRating;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "enrolled_count", nullable = false)
    private int enrolledCount;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "total_duration_seconds", nullable = false)
    private int totalDurationSeconds;

    @Column(name = "published_at")
    private Instant publishedAt;

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
    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public String getMentorDisplayName() { return mentorDisplayName; }
    public void setMentorDisplayName(String mentorDisplayName) { this.mentorDisplayName = mentorDisplayName; }
    public String getCreatorType() { return creatorType; }
    public void setCreatorType(String creatorType) { this.creatorType = creatorType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }
    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }
    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }
    public Integer getDiscountPriceCents() { return discountPriceCents; }
    public void setDiscountPriceCents(Integer discountPriceCents) { this.discountPriceCents = discountPriceCents; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getWhatYouLearn() { return whatYouLearn; }
    public void setWhatYouLearn(String whatYouLearn) { this.whatYouLearn = whatYouLearn; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }
    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    public int getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(int totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
