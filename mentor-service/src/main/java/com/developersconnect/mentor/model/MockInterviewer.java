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
@Table(name = "mock_interviewers")
public class MockInterviewer {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID userId;

    @Column(length = 200)
    private String headline;

    @Column(length = 128)
    private String company;

    @Column(length = 64)
    private String experience;

    @Column(length = 512)
    private String skills;

    @Column(nullable = false)
    private double rating;

    @Column(nullable = false)
    private long totalReviews;

    @Column(nullable = false)
    private long totalInterviews;

    @Column(nullable = false)
    private int hourlyRateCents;

    @Column(length = 2000)
    private String bio;

    @Column(length = 512)
    private String profilePicture;

    @Column(nullable = false)
    private boolean online;

    @Column(nullable = false, length = 16)
    private String status = STATUS_ACTIVE;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
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
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(long totalReviews) { this.totalReviews = totalReviews; }
    public long getTotalInterviews() { return totalInterviews; }
    public void setTotalInterviews(long totalInterviews) { this.totalInterviews = totalInterviews; }
    public int getHourlyRateCents() { return hourlyRateCents; }
    public void setHourlyRateCents(int hourlyRateCents) { this.hourlyRateCents = hourlyRateCents; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public boolean isOnline() { return online; }
    public void setOnline(boolean online) { this.online = online; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
