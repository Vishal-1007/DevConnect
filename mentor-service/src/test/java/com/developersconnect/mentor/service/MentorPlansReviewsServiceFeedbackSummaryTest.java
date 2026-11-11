package com.developersconnect.mentor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.developersconnect.mentor.dto.MentorAccessResponse;
import com.developersconnect.mentor.dto.MentorFeedbackSummaryResponse;
import com.developersconnect.mentor.model.MentorReview;
import com.developersconnect.mentor.repository.MentorMentorshipPlanRepository;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorReviewRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MentorPlansReviewsServiceFeedbackSummaryTest {

    @Mock
    private MentorMentorshipPlanRepository planRepository;
    @Mock
    private MentorReviewRepository reviewRepository;
    @Mock
    private MentorProfileRepository profileRepository;
    @Mock
    private MentorProfileService mentorProfileService;
    @Mock
    private MentorshipRequestService mentorshipRequestService;

    private MentorPlansReviewsService service;
    private UUID mentorId;

    @BeforeEach
    void setUp() {
        service = new MentorPlansReviewsService(
            planRepository,
            reviewRepository,
            profileRepository,
            mentorProfileService,
            mentorshipRequestService
        );
        mentorId = UUID.randomUUID();
        when(mentorProfileService.getMentorAccess(mentorId))
            .thenReturn(new MentorAccessResponse(true, "APPROVED", false, null));
    }

    @Test
    void getFeedbackSummaryCalculatesAverageAndDistributionFromDatabase() {
        MentorReview five = review(5, "Great mentor", "More coding");
        MentorReview four = review(4, "Helpful sessions", null);
        MentorReview fiveAgain = review(5, "Excellent", null);

        when(reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId))
            .thenReturn(List.of(five, four, fiveAgain));
        when(reviewRepository.countTestimonialsWithComment(mentorId)).thenReturn(3L);

        MentorFeedbackSummaryResponse summary = service.getFeedbackSummary(mentorId);

        assertThat(summary.averageRating()).isEqualTo(4.7);
        assertThat(summary.totalReviews()).isEqualTo(3);
        assertThat(summary.totalTestimonials()).isEqualTo(3);
        assertThat(summary.ratingDistribution()).containsEntry("5", 2L);
        assertThat(summary.ratingDistribution()).containsEntry("4", 1L);
        assertThat(summary.ratingDistribution()).containsEntry("3", 0L);
        assertThat(summary.improvementSuggestions()).containsExactly("More coding");
        assertThat(summary.reviews()).hasSize(3);
    }

    @Test
    void getFeedbackSummaryReturnsZerosWhenNoReviews() {
        when(reviewRepository.findByMentorIdOrderByCreatedAtDesc(mentorId)).thenReturn(List.of());
        when(reviewRepository.countTestimonialsWithComment(mentorId)).thenReturn(0L);

        MentorFeedbackSummaryResponse summary = service.getFeedbackSummary(mentorId);

        assertThat(summary.averageRating()).isEqualTo(0.0);
        assertThat(summary.totalReviews()).isZero();
        assertThat(summary.totalTestimonials()).isZero();
        assertThat(summary.reviews()).isEmpty();
    }

    private MentorReview review(int rating, String text, String suggestion) {
        MentorReview review = new MentorReview();
        review.setMentorId(mentorId);
        review.setLearnerId(UUID.randomUUID());
        review.setLearnerName("Student");
        review.setRating(rating);
        review.setReviewText(text);
        review.setImprovementSuggestion(suggestion);
        review.setShowcased(false);
        review.setCreatedAt(Instant.parse("2026-06-21T10:00:00Z"));
        return review;
    }
}
