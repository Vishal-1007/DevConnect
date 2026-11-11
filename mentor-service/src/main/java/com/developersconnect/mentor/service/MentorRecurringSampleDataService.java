package com.developersconnect.mentor.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.developersconnect.mentor.model.MentorProfile;
import com.developersconnect.mentor.model.MentorRecurringPlan;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorProfileRepository;
import com.developersconnect.mentor.repository.MentorRecurringPlanRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;

@Service
@Profile("local")
public class MentorRecurringSampleDataService {

    private static final Logger log = LoggerFactory.getLogger(MentorRecurringSampleDataService.class);

    private final MentorRecurringPlanRepository recurringPlanRepository;
    private final MentorshipBookingRepository bookingRepository;
    private final MentorProfileRepository mentorProfileRepository;

    public MentorRecurringSampleDataService(
        MentorRecurringPlanRepository recurringPlanRepository,
        MentorshipBookingRepository bookingRepository,
        MentorProfileRepository mentorProfileRepository
    ) {
        this.recurringPlanRepository = recurringPlanRepository;
        this.bookingRepository = bookingRepository;
        this.mentorProfileRepository = mentorProfileRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureSampleRecurringPlans(UUID mentorId) {
        if (!recurringPlanRepository.findByMentorIdOrderByCreatedAtDesc(mentorId).isEmpty()) {
            return;
        }

        List<MentorshipBooking> bookings = bookingRepository.findByMentorIdOrderByScheduledAtDesc(
            mentorId,
            PageRequest.of(0, 20)
        );
        if (bookings.isEmpty()) {
            return;
        }

        ZoneId zone = ZoneId.of("Asia/Kolkata");
        MentorshipBooking learner1 = bookings.stream()
            .filter(b -> "learner1".equals(b.getLearnerDisplayName()))
            .findFirst()
            .orElse(bookings.get(0));
        MentorshipBooking vishu01 = bookings.stream()
            .filter(b -> "vishu01".equals(b.getLearnerDisplayName()))
            .findFirst()
            .orElse(bookings.get(Math.min(1, bookings.size() - 1)));

        seedPlan(mentorId, learner1, "Weekly DSA Mentorship", "weekly", 3, "19:00", 45, zone);
        seedPlan(mentorId, vishu01, "Bi-weekly Project Review", "biweekly", 5, "20:00", 60, zone);

        MentorProfile profile = mentorProfileRepository.findById(mentorId).orElse(null);
        if (profile != null && !profile.isAvailable()) {
            profile.setAvailable(true);
            profile.setAvailabilityTimezone("Asia/Kolkata");
            profile.setAutoSchedulingEnabled(true);
            mentorProfileRepository.save(profile);
        }

        log.info("Seeded recurring mentorship plans for mentor {}", mentorId);
    }

    private void seedPlan(
        UUID mentorId,
        MentorshipBooking booking,
        String title,
        String frequency,
        int dayOfWeek,
        String startTime,
        int durationMinutes,
        ZoneId zone
    ) {
        MentorRecurringPlan plan = new MentorRecurringPlan();
        plan.setMentorId(mentorId);
        plan.setLearnerId(booking.getLearnerId());
        plan.setLearnerName(booking.getLearnerDisplayName());
        plan.setTitle(title);
        plan.setFrequency(frequency);
        plan.setDayOfWeek(dayOfWeek);
        plan.setStartTime(startTime);
        plan.setDurationMinutes(durationMinutes);
        plan.setStatus("active");
        LocalTime time = LocalTime.parse(startTime);
        LocalDate nextDate = LocalDate.now(zone).plusDays(3);
        plan.setNextSessionAt(nextDate.atTime(time).atZone(zone).toInstant());
        recurringPlanRepository.save(plan);
    }
}
