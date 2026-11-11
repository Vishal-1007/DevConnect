package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.MentorMentorshipPlan;
import com.developersconnect.mentor.repository.MentorMentorshipPlanRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("local")
public class MentorPlansReviewsSampleDataService {

    private static final Logger log = LoggerFactory.getLogger(MentorPlansReviewsSampleDataService.class);

    private final MentorMentorshipPlanRepository planRepository;

    public MentorPlansReviewsSampleDataService(MentorMentorshipPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureSamplePlansAndReviews(UUID mentorId) {
        ensurePlans(mentorId);
    }

    private void ensurePlans(UUID mentorId) {
        if (planRepository.countByMentorId(mentorId) > 0) {
            return;
        }

        seedPlan(mentorId, "1:1 Session", "one_on_one", "one_time", 5000, 1, 60, "60 min",
            false, false, 0, "Direct mentorship|||Screen sharing|||Code review|||Session notes");
        seedPlan(mentorId, "Weekly Plan", "weekly", "weekly_subscription", 17500, 4, 60, "60 min",
            true, true, 1, "4 sessions/month|||Priority scheduling|||Study material|||WhatsApp support");
        seedPlan(mentorId, "Monthly Coaching", "monthly", "monthly_subscription", 60000, 16, 60, "60 min + async",
            true, false, 2, "16 sessions/month|||Resume review|||Mock interviews|||Referrals");
        seedPlan(mentorId, "Mock Interview Pack", "mock_interview", "one_time", 10000, 3, 45, "45 min",
            false, false, 3, "3 mock interviews|||Detailed feedback|||Improvement roadmap|||Post-session notes");
        seedPlan(mentorId, "Job-Switch Roadmap", "job_switch", "monthly_subscription", 35000, 8, 60, "8 sessions",
            true, false, 4, "Career strategy|||Resume & LinkedIn|||Mock loops|||Offer negotiation");

        log.info("Seeded mentorship plans for mentor {}", mentorId);
    }

    private void seedPlan(
        UUID mentorId, String title, String planType, String billingType,
        int priceCents, int sessionLimit, int durationMin, String durationLabel,
        boolean premium, boolean popular, int sortOrder, String features
    ) {
        MentorMentorshipPlan plan = new MentorMentorshipPlan();
        plan.setMentorId(mentorId);
        plan.setTitle(title);
        plan.setDescription("Professional " + title.toLowerCase() + " package");
        plan.setPlanType(planType);
        plan.setBillingType(billingType);
        plan.setPriceCents(priceCents);
        plan.setSessionLimit(sessionLimit);
        plan.setDurationMinutes(durationMin);
        plan.setDurationLabel(durationLabel);
        plan.setPremiumSupport(premium);
        plan.setPopular(popular);
        plan.setActive(true);
        plan.setSortOrder(sortOrder);
        plan.setFeatures(features);
        planRepository.save(plan);
    }
}
