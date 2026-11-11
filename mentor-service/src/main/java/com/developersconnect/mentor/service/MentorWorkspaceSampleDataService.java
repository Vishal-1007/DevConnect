package com.developersconnect.mentor.service;



import com.developersconnect.mentor.model.MentorAvailabilitySlot;

import com.developersconnect.mentor.model.MentorProfile;

import com.developersconnect.mentor.model.MentorshipBooking;

import com.developersconnect.mentor.repository.MentorAvailabilitySlotRepository;

import com.developersconnect.mentor.repository.MentorProfileRepository;

import com.developersconnect.mentor.repository.MentorshipBookingRepository;

import java.time.Instant;

import java.time.temporal.ChronoUnit;

import java.util.UUID;

import org.slf4j.Logger;

import org.slf4j.LoggerFactory;

import org.springframework.context.annotation.Profile;

import org.springframework.data.domain.PageRequest;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Propagation;

import org.springframework.transaction.annotation.Transactional;



/**

 * Seeds demo workspace data for mentors with no bookings (local dev only).

 * Runs at startup and lazily on first dashboard access for mentors approved after boot.

 */

@Service

@Profile("local")

public class MentorWorkspaceSampleDataService {



    private static final Logger log = LoggerFactory.getLogger(MentorWorkspaceSampleDataService.class);



    /** type, title, message, learner, durationMin, status, premium */

    private static final String[][] SAMPLE_SESSIONS = {

        {"system-design", "System Design Mock Interview", "Need help designing a scalable notification system", "admin", "60", "confirmed", "false"},

        {"project-help", "Spring Boot Microservices", "Need help with Spring Boot microservices — service discovery and config server setup", "vishu01", "45", "pending", "true"},

        {"code-review", "React Code Review", "Please review my custom hooks and component structure before my interview", "vishu01", "45", "pending", "true"},

        {"mock-interview", "DSA Mock Interview", "45-min mock interview focused on graphs and dynamic programming", "learner1", "45", "pending", "false"},

        {"career-guidance", "Career Guidance Session", "Switching from backend to full-stack — need a structured roadmap", "learner2", "30", "completed", "false"},

        {"project-help", "Backend Architecture Discussion", "Help me refactor a monolith into microservices step by step", "learner1", "60", "confirmed", "false"},

    };



    private static final String[][] EXTRA_PENDING = {

        {"system-design", "System Design Discussion", "How should I approach designing a real-time chat system at scale?", "admin", "60", "true"},

        {"career-guidance", "Career Transition Plan", "3 YOE backend dev — want to move into staff engineer track", "learner2", "30", "false"},

    };



    private final MentorProfileRepository mentorProfileRepository;

    private final MentorshipBookingRepository bookingRepository;

    private final MentorAvailabilitySlotRepository availabilityRepository;



    public MentorWorkspaceSampleDataService(

        MentorProfileRepository mentorProfileRepository,

        MentorshipBookingRepository bookingRepository,

        MentorAvailabilitySlotRepository availabilityRepository

    ) {

        this.mentorProfileRepository = mentorProfileRepository;

        this.bookingRepository = bookingRepository;

        this.availabilityRepository = availabilityRepository;

    }



    @Transactional(propagation = Propagation.REQUIRES_NEW)

    public void ensureSampleDataIfEmpty(UUID mentorId) {

        MentorProfile mentor = mentorProfileRepository.findById(mentorId).orElse(null);

        if (mentor == null) {

            return;

        }

        if (!bookingRepository.findByMentorIdOrderByScheduledAtDesc(

            mentorId, PageRequest.of(0, 1)

        ).isEmpty()) {

            enrichPendingRequests(mentor);

            return;

        }

        seedMentorWorkspace(mentor);

        log.info("Seeded mentor workspace sample data for mentor {}", mentorId);

    }



    @Transactional(propagation = Propagation.REQUIRES_NEW)

    public void ensureSessionRequestQueue(UUID mentorId) {

        ensureSampleDataIfEmpty(mentorId);

    }



    public void seedAllMentorsWithoutBookings() {

        for (MentorProfile mentor : mentorProfileRepository.findAll()) {

            ensureSampleDataIfEmpty(mentor.getUserId());

        }

    }



    private void enrichPendingRequests(MentorProfile mentor) {

        UUID mentorId = mentor.getUserId();

        long pending = bookingRepository.countByMentorIdAndStatus(mentorId, "pending");

        if (pending >= 4) {

            return;

        }

        String mentorName = mentor.getHeadline() != null && !mentor.getHeadline().isBlank()

            ? mentor.getHeadline()

            : "Mentor";

        int hourly = mentor.getHourlyRateCents() != null && mentor.getHourlyRateCents() > 0

            ? mentor.getHourlyRateCents()

            : 5000;

        Instant base = Instant.now().truncatedTo(ChronoUnit.DAYS);

        String codePrefix = "RQ" + mentorId.toString().replace("-", "").substring(0, 4).toUpperCase();

        for (int i = 0; i < EXTRA_PENDING.length; i++) {

            String[] row = EXTRA_PENDING[i];

            seedBooking(

                codePrefix + i,

                mentorId,

                mentorName,

                learnerId(row[3]),

                row[3],

                base.plus(i + 1L, ChronoUnit.DAYS),

                Integer.parseInt(row[4]),

                hourly,

                "pending",

                row[1],

                row[0],

                row[2],

                Boolean.parseBoolean(row[5])

            );

        }

    }



    private void seedMentorWorkspace(MentorProfile mentor) {

        UUID mentorId = mentor.getUserId();

        String mentorName = mentor.getHeadline() != null && !mentor.getHeadline().isBlank()

            ? mentor.getHeadline()

            : "Mentor";

        int hourly = mentor.getHourlyRateCents() != null && mentor.getHourlyRateCents() > 0

            ? mentor.getHourlyRateCents()

            : 5000;



        Instant base = Instant.now().truncatedTo(ChronoUnit.DAYS);

        String codePrefix = mentorId.toString().replace("-", "").substring(0, 6).toUpperCase();



        for (int i = 0; i < SAMPLE_SESSIONS.length; i++) {

            String[] session = SAMPLE_SESSIONS[i];

            Instant scheduledAt = switch (i) {

                case 0 -> base.plus(2, ChronoUnit.HOURS);

                case 1 -> base.plus(1, ChronoUnit.DAYS);

                case 2 -> base.plus(2, ChronoUnit.DAYS);

                case 3 -> base.plus(3, ChronoUnit.DAYS);

                case 4 -> base.minus(2, ChronoUnit.DAYS);

                default -> base.plus(4, ChronoUnit.DAYS);

            };

            seedBooking(

                codePrefix + i,

                mentorId,

                mentorName,

                learnerId(session[3]),

                session[3],

                scheduledAt,

                Integer.parseInt(session[4]),

                hourly,

                session[5],

                session[1],

                session[0],

                session[2],

                Boolean.parseBoolean(session[6])

            );

        }



        if (mentor.getRatingCount() == 0) {

            mentor.setAverageRating(4.8);

            mentor.setRatingCount(2);

            mentorProfileRepository.save(mentor);

        }

    }



    private void seedAvailability(UUID mentorId) {

        if (availabilityRepository.countByMentorIdAndActiveTrue(mentorId) > 0) {

            return;

        }

        for (int day = 1; day <= 5; day++) {

            MentorAvailabilitySlot slot = new MentorAvailabilitySlot();

            slot.setMentorId(mentorId);

            slot.setDayOfWeek(day);

            slot.setStartTime("19:00");

            slot.setEndTime("23:00");

            slot.setTimezone("Asia/Kolkata");

            slot.setActive(true);

            availabilityRepository.save(slot);

        }

        MentorProfile profile = mentorProfileRepository.findById(mentorId).orElse(null);

        if (profile != null) {

            profile.setAvailable(true);

            profile.setVacationMode(false);

            profile.setAvailabilityTimezone("Asia/Kolkata");

            profile.setAutoSchedulingEnabled(true);

            mentorProfileRepository.save(profile);

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

        String title,

        String requestType,

        String requestMessage,

        boolean premiumLearner

    ) {

        if (bookingRepository.findByBookingCode(code).isPresent()) {

            return;

        }

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

        booking.setRefundStatus("none");

        booking.setNotes(title);

        booking.setRequestType(requestType);

        booking.setRequestMessage(requestMessage);

        booking.setPremiumLearner(premiumLearner);

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

