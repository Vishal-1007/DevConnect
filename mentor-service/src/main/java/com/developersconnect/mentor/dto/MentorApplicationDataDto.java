package com.developersconnect.mentor.dto;

import java.util.List;

public record MentorApplicationDataDto(
    String fullName,
    String headline,
    String company,
    String designation,
    String experienceRange,
    String location,
    String profilePictureUrl,
    String bio,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    String resumeUrl,
    String companyEmail,
    String govIdUrl,
    List<String> skills,
    List<String> categories,
    List<String> languages,
    Long audioPricePerMinuteCents,
    Long videoPricePerMinuteCents,
    Long mockInterviewPriceCents,
    Long resumeReviewPriceCents,
    Boolean instantCallEnabled,
    String accountHolderName,
    String bankName,
    String accountNumber,
    String ifscCode,
    String upiId,
    String panNumber,
    MentorApplicationAgreementsDto agreements
) {
    public record MentorApplicationAgreementsDto(
        Boolean accurateDetails,
        Boolean mentorGuidelines,
        Boolean terms,
        Boolean commission
    ) {}
}
