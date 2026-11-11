package com.developersconnect.mentor.config;

import com.developersconnect.mentor.model.MentorAvailabilitySlot;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(10)
public class LocalDevBookingSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevBookingSeeder.class);

    private static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private final MentorshipBookingRepository bookingRepository;
    private final MentorAvailabilitySlotRepository availabilityRepository;

    public LocalDevBookingSeeder(
        MentorshipBookingRepository bookingRepository,
        MentorAvailabilitySlotRepository availabilityRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.availabilityRepository = availabilityRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (bookingRepository.count() > 0) {
            return;
        }

        seedAvailability(RAHUL_ID);
        seedAvailability(SARAH_ID);
        seedAvailability(MIKE_ID);

        Instant base = Instant.now().truncatedTo(ChronoUnit.DAYS);

        seedBooking("BK0001", RAHUL_ID, "Rahul Sharma — System Design & Backend",
            learnerId("admin"), "admin", base.plus(1, ChronoUnit.DAYS), 30, 4500, "confirmed", "none");
        seedBooking("BK0002", SARAH_ID, "Sarah Chen — Frontend & React",
            learnerId("vishu01"), "vishu01", base.plus(2, ChronoUnit.DAYS), 45, 5000, "pending", "none");
        seedBooking("BK0003", MIKE_ID, "Mike Johnson — DSA & Interview Prep",
            learnerId("learner1"), "learner1", base.minus(1, ChronoUnit.DAYS), 60, 4000, "completed", "none");
        seedBooking("BK0004", RAHUL_ID, "Rahul Sharma — System Design & Backend",
            learnerId("vishu01"), "vishu01", base.minus(3, ChronoUnit.DAYS), 30, 4500, "cancelled", "none");
        seedBooking("BK0005", SARAH_ID, "Sarah Chen — Frontend & React",
            learnerId("admin"), "admin", base.plus(4, ChronoUnit.DAYS), 60, 5000, "confirmed", "none");
        seedBooking("BK0006", MIKE_ID, "Mike Johnson — DSA & Interview Prep",
            learnerId("admin"), "admin", base.minus(5, ChronoUnit.DAYS), 45, 4000, "refund_requested", "requested");
        seedBooking("BK0007", RAHUL_ID, "Rahul Sharma — System Design & Backend",
            learnerId("learner2"), "learner2", base.minus(7, ChronoUnit.DAYS), 30, 4500, "refunded", "approved");
        seedBooking("BK0008", SARAH_ID, "Sarah Chen — Frontend & React",
            learnerId("vishu01"), "vishu01", base.plus(6, ChronoUnit.DAYS), 30, 5000, "confirmed", "none");
        seedBooking("BK0009", MIKE_ID, "Mike Johnson — DSA & Interview Prep",
            learnerId("learner1"), "learner1", base.minus(2, ChronoUnit.DAYS), 60, 4000, "completed", "none");

        log.info("Seeded {} mentorship bookings", bookingRepository.count());
    }

    private void seedAvailability(UUID mentorId) {
        if (availabilityRepository.countByMentorIdAndActiveTrue(mentorId) > 0) {
            return;
        }
        for (int day = 1; day <= 5; day++) {
            MentorAvailabilitySlot slot = new MentorAvailabilitySlot();
            slot.setMentorId(mentorId);
            slot.setDayOfWeek(day);
            slot.setStartTime("18:00");
            slot.setEndTime("22:00");
            slot.setTimezone("Asia/Kolkata");
            slot.setActive(true);
            availabilityRepository.save(slot);
        }
    }

    private void seedBooking(
        String code,
        UUID mentorId,
        String mentorName,
        UUID learnerId,
        String learnerName,
        Instant scheduledAt,
        int durationMin,
        int hourlyCents,
        String status,
        String refundStatus
    ) {
        MentorshipBooking booking = new MentorshipBooking();
        booking.setBookingCode(code);
        booking.setMentorId(mentorId);
        booking.setLearnerId(learnerId);
        booking.setMentorDisplayName(mentorName);
        booking.setLearnerDisplayName(learnerName);
        booking.setScheduledAt(scheduledAt);
        booking.setDurationMinutes(durationMin);
        booking.setHourlyRateCents(hourlyCents);
        booking.setAmountCents((hourlyCents * durationMin) / 60);
        booking.setStatus(status);
        booking.setRefundStatus(refundStatus);
        if ("cancelled".equals(status)) {
            booking.setCancelledAt(Instant.now());
        }
        if ("completed".equals(status)) {
            booking.setCompletedAt(scheduledAt.plus(durationMin, ChronoUnit.MINUTES));
        }
        bookingRepository.save(booking);
    }

    private static UUID learnerId(String username) {
        return UUID.nameUUIDFromBytes(("devconnect-learner-" + username).getBytes());
    }
}
