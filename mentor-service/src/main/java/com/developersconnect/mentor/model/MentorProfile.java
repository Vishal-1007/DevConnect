package com.developersconnect.mentor.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "mentor_profiles")
public class MentorProfile {

    @Id
    private UUID userId;

    @Column(length = 128)
    private String headline;

    @Column(length = 128)
    private String fullName;

    @Column(length = 256)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(length = 512)
    private String profileImageUrl;

    @Column(length = 128)
    private String company;

    @Column(length = 128)
    private String designation;

    @Column(length = 64)
    private String experienceRange;

    @Column(length = 128)
    private String location;

    @Column(length = 512)
    private String expertiseTags;

    @Column(length = 512)
    private String technologies;

    @Column(length = 512)
    private String mentorshipCategories;

    @Column
    private Integer sessionDurationMinutes = 60;

    @Column(nullable = false)
    private boolean freeSessionAllowed;

    @Column(length = 256)
    private String linkedinUrl;

    @Column(length = 256)
    private String githubUrl;

    @Column(length = 256)
    private String portfolioUrl;

    @Column(length = 512)
    private String resumeUrl;

    @Column
    private Integer mockInterviewPriceCents;

    @Column
    private Integer resumeReviewPriceCents;

    @Column(nullable = false)
    private long sessionsCompleted;

    @Column(nullable = false, length = 16)
    private String adminStatus = "ACTIVE";

    @Column(nullable = false)
    private double responseRate = 98.0;

    @Column(length = 1024)
    private String bio;

    @Column
    private Integer hourlyRateCents;

    @Column(nullable = false)
    private boolean verified;

    @Column(nullable = false)
    private boolean available;

    @Column(nullable = false)
    private boolean vacationMode;

    @Column(nullable = false, length = 64)
    private String availabilityTimezone = "Asia/Kolkata";

    @Column(nullable = false)
    private boolean autoSchedulingEnabled = true;

    @Column(nullable = false)
    private double averageRating;

    @Column(nullable = false)
    private long ratingCount;

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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getExperienceRange() {
        return experienceRange;
    }

    public void setExperienceRange(String experienceRange) {
        this.experienceRange = experienceRange;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getExpertiseTags() {
        return expertiseTags;
    }

    public void setExpertiseTags(String expertiseTags) {
        this.expertiseTags = expertiseTags;
    }

    public String getTechnologies() {
        return technologies;
    }

    public void setTechnologies(String technologies) {
        this.technologies = technologies;
    }

    public String getMentorshipCategories() {
        return mentorshipCategories;
    }

    public void setMentorshipCategories(String mentorshipCategories) {
        this.mentorshipCategories = mentorshipCategories;
    }

    public Integer getSessionDurationMinutes() {
        return sessionDurationMinutes;
    }

    public void setSessionDurationMinutes(Integer sessionDurationMinutes) {
        this.sessionDurationMinutes = sessionDurationMinutes;
    }

    public boolean isFreeSessionAllowed() {
        return freeSessionAllowed;
    }

    public void setFreeSessionAllowed(boolean freeSessionAllowed) {
        this.freeSessionAllowed = freeSessionAllowed;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public String getPortfolioUrl() {
        return portfolioUrl;
    }

    public void setPortfolioUrl(String portfolioUrl) {
        this.portfolioUrl = portfolioUrl;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public Integer getMockInterviewPriceCents() {
        return mockInterviewPriceCents;
    }

    public void setMockInterviewPriceCents(Integer mockInterviewPriceCents) {
        this.mockInterviewPriceCents = mockInterviewPriceCents;
    }

    public Integer getResumeReviewPriceCents() {
        return resumeReviewPriceCents;
    }

    public void setResumeReviewPriceCents(Integer resumeReviewPriceCents) {
        this.resumeReviewPriceCents = resumeReviewPriceCents;
    }

    public long getSessionsCompleted() {
        return sessionsCompleted;
    }

    public void setSessionsCompleted(long sessionsCompleted) {
        this.sessionsCompleted = sessionsCompleted;
    }

    public String getAdminStatus() {
        return adminStatus;
    }

    public void setAdminStatus(String adminStatus) {
        this.adminStatus = adminStatus;
    }

    public double getResponseRate() {
        return responseRate;
    }

    public void setResponseRate(double responseRate) {
        this.responseRate = responseRate;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Integer getHourlyRateCents() {
        return hourlyRateCents;
    }

    public void setHourlyRateCents(Integer hourlyRateCents) {
        this.hourlyRateCents = hourlyRateCents;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public boolean isVacationMode() {
        return vacationMode;
    }

    public void setVacationMode(boolean vacationMode) {
        this.vacationMode = vacationMode;
    }

    /** IANA timezone for mentor availability (e.g. Asia/Kolkata). */
    public String getAvailabilityTimezone() {
        return availabilityTimezone;
    }

    public void setAvailabilityTimezone(String availabilityTimezone) {
        this.availabilityTimezone = availabilityTimezone;
    }

    public boolean isAutoSchedulingEnabled() {
        return autoSchedulingEnabled;
    }

    public void setAutoSchedulingEnabled(boolean autoSchedulingEnabled) {
        this.autoSchedulingEnabled = autoSchedulingEnabled;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(long ratingCount) {
        this.ratingCount = ratingCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
