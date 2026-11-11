package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.MentorStudentRecord;
import com.developersconnect.mentor.model.MentorStudentRoadmapItem;
import com.developersconnect.mentor.model.MentorStudentTask;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.repository.MentorStudentRecordRepository;
import com.developersconnect.mentor.repository.MentorStudentRoadmapItemRepository;
import com.developersconnect.mentor.repository.MentorStudentTaskRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("local")
public class MentorStudentSampleDataService {

    private static final Logger log = LoggerFactory.getLogger(MentorStudentSampleDataService.class);

    private record StudentSeed(
        String learnerName,
        String category,
        String weakArea,
        String strongArea,
        String notes,
        int interviewReadiness,
        String interviewTarget,
        int baselineProgress,
        String[][] tasks,
        String[][] roadmap
    ) {}

    private static final Map<String, StudentSeed> PROFILES = Map.of(
        "learner1", new StudentSeed(
            "learner1", "interview_prep", "DSA", "React",
            "Rahul-style profile: weak in DSA, strong in frontend. Focus on graph problems and Amazon-style LP questions.",
            62, "Amazon", 25,
            new String[][] {
                {"Complete 20 medium LeetCode problems", "Graphs & trees focus", "in_progress", "3"},
                {"Mock behavioral interview prep", "STAR format stories", "pending", "7"},
                {"Build portfolio project showcase", "React + Node capstone", "completed", "-2"},
            },
            new String[][] {
                {"Arrays & Hash Maps refresher", "Week 1", "completed"},
                {"Graph traversal patterns", "Week 2", "active"},
                {"System design fundamentals", "Week 3", "active"},
                {"Amazon OA simulation", "Week 4", "locked"},
            }
        ),
        "learner2", new StudentSeed(
            "learner2", "career_switch", "DevOps", "Career",
            "Transitioning from backend to staff track. Needs structured roadmap and leadership narrative.",
            45, "Staff Engineer", 10,
            new String[][] {
                {"Draft career transition story", "3 YOE narrative", "in_progress", "5"},
                {"Complete staff engineer reading list", "Chapters 1-3", "pending", "14"},
            },
            new String[][] {
                {"Define target role & companies", "Phase 1", "completed"},
                {"Build visibility via tech talks", "Phase 2", "active"},
                {"Staff-level system design prep", "Phase 3", "locked"},
            }
        ),
        "vishu01", new StudentSeed(
            "vishu01", "active_project", "Backend", "Java",
            "Working on Spring Boot microservices. Strong Java fundamentals, needs architecture guidance.",
            38, "", 15,
            new String[][] {
                {"Set up service discovery", "Eureka + config server", "in_progress", "4"},
                {"API gateway routing rules", "Spring Cloud Gateway", "pending", "10"},
            },
            new String[][] {
                {"Monolith audit & module boundaries", "Sprint 1", "completed"},
                {"Extract auth service", "Sprint 2", "active"},
                {"Observability stack", "Sprint 3", "locked"},
            }
        ),
        "admin", new StudentSeed(
            "admin", "interview_prep", "System Design", "Backend",
            "Senior candidate preparing for FAANG system design rounds. Strong backend, needs scalability patterns.",
            71, "Google", 40,
            new String[][] {
                {"Design notification system", "Whiteboard + doc", "completed", "-5"},
                {"Rate limiter implementation", "Token bucket", "in_progress", "2"},
            },
            new String[][] {
                {"Scalability patterns review", "Month 1", "completed"},
                {"Distributed systems deep dive", "Month 2", "active"},
                {"Mock design interviews", "Month 3", "active"},
            }
        )
    );

    private final MentorshipBookingRepository bookingRepository;
    private final MentorStudentRecordRepository recordRepository;
    private final MentorStudentTaskRepository taskRepository;
    private final MentorStudentRoadmapItemRepository roadmapRepository;

    public MentorStudentSampleDataService(
        MentorshipBookingRepository bookingRepository,
        MentorStudentRecordRepository recordRepository,
        MentorStudentTaskRepository taskRepository,
        MentorStudentRoadmapItemRepository roadmapRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.recordRepository = recordRepository;
        this.taskRepository = taskRepository;
        this.roadmapRepository = roadmapRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureSampleStudentProfiles(UUID mentorId) {
        List<MentorshipBooking> bookings = bookingRepository.findByMentorIdOrderByScheduledAtDesc(
            mentorId,
            PageRequest.of(0, 500)
        );
        if (bookings.isEmpty()) {
            return;
        }

        boolean seeded = false;
        for (MentorshipBooking booking : bookings) {
            String name = booking.getLearnerDisplayName();
            StudentSeed seed = PROFILES.get(name);
            if (seed == null) {
                continue;
            }
            UUID learnerId = booking.getLearnerId();
            if (recordRepository.findByMentorIdAndLearnerId(mentorId, learnerId).isPresent()) {
                continue;
            }
            seedProfile(mentorId, learnerId, seed);
            seeded = true;
        }

        if (seeded) {
            log.info("Seeded mentor student profiles for mentor {}", mentorId);
        }
    }

    private void seedProfile(UUID mentorId, UUID learnerId, StudentSeed seed) {
        MentorStudentRecord record = new MentorStudentRecord();
        record.setMentorId(mentorId);
        record.setLearnerId(learnerId);
        record.setLearnerName(seed.learnerName());
        record.setCategory(seed.category());
        record.setWeakArea(seed.weakArea());
        record.setStrongArea(seed.strongArea());
        record.setNotes(seed.notes());
        record.setInterviewReadinessPct(seed.interviewReadiness());
        record.setInterviewTarget(seed.interviewTarget().isBlank() ? null : seed.interviewTarget());
        record.setBaselineProgressPct(seed.baselineProgress());
        recordRepository.save(record);

        for (String[] row : seed.tasks()) {
            MentorStudentTask task = new MentorStudentTask();
            task.setMentorId(mentorId);
            task.setLearnerId(learnerId);
            task.setTitle(row[0]);
            task.setDescription(row[1]);
            task.setStatus(row[2]);
            int days = Integer.parseInt(row[3]);
            task.setDueDate(days >= 0 ? LocalDate.now().plusDays(days) : LocalDate.now().minusDays(-days));
            taskRepository.save(task);
        }

        int order = 0;
        for (String[] row : seed.roadmap()) {
            MentorStudentRoadmapItem item = new MentorStudentRoadmapItem();
            item.setMentorId(mentorId);
            item.setLearnerId(learnerId);
            item.setTitle(row[0]);
            item.setMilestone(row[1]);
            item.setSortOrder(order++);
            item.setStatus(row[2]);
            roadmapRepository.save(item);
        }
    }
}
