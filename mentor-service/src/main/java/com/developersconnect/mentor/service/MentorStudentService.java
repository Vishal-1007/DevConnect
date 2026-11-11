package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateMentorStudentRoadmapRequest;
import com.developersconnect.mentor.dto.CreateMentorStudentTaskRequest;
import com.developersconnect.mentor.dto.MentorStudentDetailResponse;
import com.developersconnect.mentor.dto.MentorStudentImprovementPoint;
import com.developersconnect.mentor.dto.MentorStudentResponse;
import com.developersconnect.mentor.dto.MentorStudentRoadmapItemResponse;
import com.developersconnect.mentor.dto.MentorStudentSessionHistoryItem;
import com.developersconnect.mentor.dto.MentorStudentTaskResponse;
import com.developersconnect.mentor.dto.UpdateMentorStudentRequest;
import com.developersconnect.mentor.dto.UpdateMentorStudentRoadmapRequest;
import com.developersconnect.mentor.dto.UpdateMentorStudentTaskRequest;
import com.developersconnect.mentor.model.MentorshipBooking;
import com.developersconnect.mentor.model.MentorStudentRoadmapItem;
import com.developersconnect.mentor.model.MentorStudentTask;
import com.developersconnect.mentor.model.MentorStudentRecord;
import com.developersconnect.mentor.repository.MentorStudentRecordRepository;
import com.developersconnect.mentor.repository.MentorStudentRoadmapItemRepository;
import com.developersconnect.mentor.repository.MentorStudentTaskRepository;
import com.developersconnect.mentor.repository.MentorshipBookingRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorStudentService {

    private static final String[] TOPICS = {
        "System Design", "DSA", "React", "Backend", "Career", "Java", "DevOps"
    };

    private static final Map<String, String> CATEGORY_LABELS = Map.of(
        "job_seeker", "Job Seeker",
        "beginner", "Beginner",
        "interview_prep", "Interview Prep",
        "career_switch", "Career Switch",
        "system_design", "System Design",
        "active_project", "Active Project"
    );

    private final MentorshipBookingRepository bookingRepository;
    private final MentorProfileService mentorProfileService;
    private final MentorStudentRecordRepository recordRepository;
    private final MentorStudentTaskRepository taskRepository;
    private final MentorStudentRoadmapItemRepository roadmapRepository;

    public MentorStudentService(
        MentorshipBookingRepository bookingRepository,
        MentorProfileService mentorProfileService,
        MentorStudentRecordRepository recordRepository,
        MentorStudentTaskRepository taskRepository,
        MentorStudentRoadmapItemRepository roadmapRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.mentorProfileService = mentorProfileService;
        this.recordRepository = recordRepository;
        this.taskRepository = taskRepository;
        this.roadmapRepository = roadmapRepository;
    }

    @Transactional(readOnly = true)
    public List<MentorStudentResponse> listActiveStudents(UUID mentorId, String category) {
        return listStudents(mentorId, category);
    }

    @Transactional(readOnly = true)
    public List<MentorStudentResponse> listStudents(UUID mentorId, String category) {
        requireApprovedMentor(mentorId);
        Map<UUID, List<MentorshipBooking>> byLearner = loadBookingsByLearner(mentorId);
        List<MentorStudentRecord> activeRecords = recordRepository.listActiveStudentsByMentorId(
            mentorId, MentorStudentRecord.STATUS_ACTIVE
        );
        Set<UUID> processed = new HashSet<>();
        List<MentorStudentResponse> students = new ArrayList<>();

        for (MentorStudentRecord activeRecord : activeRecords) {
            UUID learnerId = activeRecord.getLearnerId();
            processed.add(learnerId);
            if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)
                && !category.equalsIgnoreCase(activeRecord.getCategory())) {
                continue;
            }
            List<MentorshipBooking> learnerBookings = byLearner.getOrDefault(learnerId, List.of());
            students.add(toStudentResponse(learnerId, learnerBookings, activeRecord));
        }

        for (Map.Entry<UUID, List<MentorshipBooking>> entry : byLearner.entrySet()) {
            UUID learnerId = entry.getKey();
            if (processed.contains(learnerId)) {
                continue;
            }
            List<MentorshipBooking> learnerBookings = entry.getValue();
            MentorStudentRecord linkedRecord = ensureRecord(mentorId, learnerId, learnerBookings.get(0));
            if (!MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(linkedRecord.getStatus())) {
                continue;
            }
            if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)
                && !category.equalsIgnoreCase(linkedRecord.getCategory())) {
                continue;
            }
            students.add(toStudentResponse(learnerId, learnerBookings, linkedRecord));
        }

        students.sort(Comparator.comparing(MentorStudentResponse::sessions).reversed());
        return students;
    }

    @Transactional(readOnly = true)
    public MentorStudentDetailResponse getStudentDetail(UUID mentorId, UUID learnerId) {
        requireApprovedMentor(mentorId);
        List<MentorshipBooking> learnerBookings = bookingRepository.findByMentorIdOrderByScheduledAtDesc(
            mentorId,
            PageRequest.of(0, 500)
        ).stream()
            .filter(b -> b.getLearnerId().equals(learnerId))
            .toList();

        MentorStudentRecord record = recordRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .orElse(null);

        if (record == null && learnerBookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }

        if (record == null) {
            record = ensureRecord(mentorId, learnerId, learnerBookings.get(0));
        }

        if (learnerBookings.isEmpty()
            && !MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }

        MentorStudentResponse summary = toStudentResponse(learnerId, learnerBookings, record);
        List<MentorStudentTaskResponse> tasks = taskRepository
            .findByMentorIdAndLearnerIdOrderByCreatedAtDesc(mentorId, learnerId)
            .stream()
            .map(this::toTaskResponse)
            .toList();
        List<MentorStudentRoadmapItemResponse> roadmap = roadmapRepository
            .findByMentorIdAndLearnerIdOrderBySortOrderAsc(mentorId, learnerId)
            .stream()
            .map(this::toRoadmapResponse)
            .toList();

        return new MentorStudentDetailResponse(
            summary.learnerId(),
            summary.name(),
            summary.role(),
            summary.sessions(),
            summary.progressPct(),
            summary.weakArea(),
            summary.strongArea(),
            summary.status(),
            summary.lastSessionLabel(),
            summary.lastSessionAt(),
            summary.category(),
            summary.categoryLabel(),
            summary.interviewReadinessPct(),
            summary.interviewTarget(),
            record.getNotes() != null ? record.getNotes() : "",
            summary.assignedTaskCount(),
            summary.pendingTaskCount(),
            summary.improvementPct(),
            buildSessionHistory(learnerBookings),
            tasks,
            roadmap,
            buildImprovementTrend(learnerBookings, record.getBaselineProgressPct())
        );
    }

    @Transactional
    public MentorStudentDetailResponse updateStudent(UUID mentorId, UUID learnerId, UpdateMentorStudentRequest request) {
        requireApprovedMentor(mentorId);
        MentorStudentRecord record = requireActiveStudentRecord(mentorId, learnerId);

        if (request.category() != null && !request.category().isBlank()) {
            record.setCategory(normalizeCategory(request.category()));
        }
        if (request.weakArea() != null) {
            record.setWeakArea(request.weakArea().isBlank() ? null : request.weakArea());
        }
        if (request.strongArea() != null) {
            record.setStrongArea(request.strongArea().isBlank() ? null : request.strongArea());
        }
        if (request.notes() != null) {
            record.setNotes(request.notes());
        }
        if (request.interviewReadinessPct() != null) {
            record.setInterviewReadinessPct(Math.min(100, Math.max(0, request.interviewReadinessPct())));
        }
        if (request.interviewTarget() != null) {
            record.setInterviewTarget(request.interviewTarget().isBlank() ? null : request.interviewTarget());
        }

        recordRepository.save(record);
        return getStudentDetail(mentorId, learnerId);
    }

    @Transactional
    public MentorStudentTaskResponse createTask(UUID mentorId, UUID learnerId, CreateMentorStudentTaskRequest request) {
        requireApprovedMentor(mentorId);
        requireActiveStudentRecord(mentorId, learnerId);

        MentorStudentTask task = new MentorStudentTask();
        task.setMentorId(mentorId);
        task.setLearnerId(learnerId);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        task.setStatus("pending");
        return toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public MentorStudentTaskResponse updateTask(
        UUID mentorId,
        UUID learnerId,
        UUID taskId,
        UpdateMentorStudentTaskRequest request
    ) {
        requireApprovedMentor(mentorId);
        MentorStudentTask task = taskRepository.findByIdAndMentorIdAndLearnerId(taskId, mentorId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        if (request.title() != null && !request.title().isBlank()) {
            task.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.status() != null && !request.status().isBlank()) {
            task.setStatus(normalizeTaskStatus(request.status()));
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        return toTaskResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID mentorId, UUID learnerId, UUID taskId) {
        requireApprovedMentor(mentorId);
        MentorStudentTask task = taskRepository.findByIdAndMentorIdAndLearnerId(taskId, mentorId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        taskRepository.delete(task);
    }

    @Transactional
    public MentorStudentRoadmapItemResponse createRoadmapItem(
        UUID mentorId,
        UUID learnerId,
        CreateMentorStudentRoadmapRequest request
    ) {
        requireApprovedMentor(mentorId);
        requireActiveStudentRecord(mentorId, learnerId);

        int nextOrder = roadmapRepository.findByMentorIdAndLearnerIdOrderBySortOrderAsc(mentorId, learnerId)
            .stream()
            .mapToInt(MentorStudentRoadmapItem::getSortOrder)
            .max()
            .orElse(-1) + 1;

        MentorStudentRoadmapItem item = new MentorStudentRoadmapItem();
        item.setMentorId(mentorId);
        item.setLearnerId(learnerId);
        item.setTitle(request.title().trim());
        item.setMilestone(request.milestone());
        item.setSortOrder(request.sortOrder() != null ? request.sortOrder() : nextOrder);
        item.setStatus("active");
        return toRoadmapResponse(roadmapRepository.save(item));
    }

    @Transactional
    public MentorStudentRoadmapItemResponse updateRoadmapItem(
        UUID mentorId,
        UUID learnerId,
        UUID itemId,
        UpdateMentorStudentRoadmapRequest request
    ) {
        requireApprovedMentor(mentorId);
        MentorStudentRoadmapItem item = roadmapRepository.findByIdAndMentorIdAndLearnerId(itemId, mentorId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap item not found"));

        if (request.title() != null && !request.title().isBlank()) {
            item.setTitle(request.title().trim());
        }
        if (request.milestone() != null) {
            item.setMilestone(request.milestone());
        }
        if (request.sortOrder() != null) {
            item.setSortOrder(request.sortOrder());
        }
        if (request.status() != null && !request.status().isBlank()) {
            item.setStatus(normalizeRoadmapStatus(request.status()));
        }
        return toRoadmapResponse(roadmapRepository.save(item));
    }

    @Transactional
    public void deleteRoadmapItem(UUID mentorId, UUID learnerId, UUID itemId) {
        requireApprovedMentor(mentorId);
        MentorStudentRoadmapItem item = roadmapRepository.findByIdAndMentorIdAndLearnerId(itemId, mentorId, learnerId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Roadmap item not found"));
        roadmapRepository.delete(item);
    }

    private Map<UUID, List<MentorshipBooking>> loadBookingsByLearner(UUID mentorId) {
        return bookingRepository.findByMentorIdOrderByScheduledAtDesc(mentorId, PageRequest.of(0, 500))
            .stream()
            .collect(Collectors.groupingBy(MentorshipBooking::getLearnerId, LinkedHashMap::new, Collectors.toList()));
    }

    private MentorStudentRecord requireActiveStudentRecord(UUID mentorId, UUID learnerId) {
        return recordRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .filter(record -> MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
    }

    private List<MentorshipBooking> requireLearnerBookings(UUID mentorId, UUID learnerId) {
        List<MentorshipBooking> bookings = bookingRepository.findByMentorIdOrderByScheduledAtDesc(
            mentorId,
            PageRequest.of(0, 500)
        ).stream()
            .filter(b -> b.getLearnerId().equals(learnerId))
            .toList();
        if (bookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found");
        }
        return bookings;
    }

    private MentorStudentRecord ensureRecord(UUID mentorId, UUID learnerId, MentorshipBooking latest) {
        return recordRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .orElseGet(() -> {
                int topicIdx = Math.floorMod(learnerId.hashCode(), TOPICS.length);
                MentorStudentRecord record = new MentorStudentRecord();
                record.setMentorId(mentorId);
                record.setLearnerId(learnerId);
                record.setLearnerName(latest.getLearnerDisplayName());
                record.setCategory(defaultCategory(latest));
                record.setWeakArea(TOPICS[topicIdx]);
                record.setStrongArea(TOPICS[(topicIdx + 2) % TOPICS.length]);
                record.setInterviewReadinessPct(estimateInterviewReadiness(latest));
                record.setInterviewTarget(null);
                record.setBaselineProgressPct(0);
                record.setStatus(MentorStudentRecord.STATUS_ACTIVE);
                record.setAcceptedAt(Instant.now());
                return recordRepository.save(record);
            });
    }

    private MentorStudentResponse toStudentResponse(
        UUID learnerId,
        List<MentorshipBooking> learnerBookings,
        MentorStudentRecord record
    ) {
        MentorshipBooking latest = learnerBookings.isEmpty() ? null : learnerBookings.get(0);
        String displayName = firstNonBlank(
            record.getLearnerName(),
            latest != null ? latest.getLearnerDisplayName() : null,
            "Student"
        );
        long completed = learnerBookings.stream().filter(b -> "completed".equals(b.getStatus())).count();
        long total = learnerBookings.stream()
            .filter(b -> !Set.of("cancelled", "refunded").contains(b.getStatus()))
            .count();
        int progress = total == 0
            ? Math.min(100, record.getBaselineProgressPct() + 10)
            : (int) Math.min(100, Math.round((completed * 100.0) / total));
        boolean active = MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus())
            || learnerBookings.stream().anyMatch(b ->
                Set.of("pending", "confirmed").contains(b.getStatus())
                    && b.getScheduledAt().isAfter(Instant.now().minus(30, ChronoUnit.DAYS))
            );
        Instant lastSession = learnerBookings.stream()
            .map(MentorshipBooking::getScheduledAt)
            .max(Instant::compareTo)
            .orElse(record.getAcceptedAt());

        String weak = record.getWeakArea() != null ? record.getWeakArea() : TOPICS[0];
        String strong = record.getStrongArea() != null ? record.getStrongArea() : TOPICS[2];
        long taskCount = taskRepository.countByMentorIdAndLearnerId(record.getMentorId(), learnerId);
        long pendingTasks = taskRepository.countByMentorIdAndLearnerIdAndStatusNot(
            record.getMentorId(),
            learnerId,
            "completed"
        );
        int improvement = Math.max(0, progress - record.getBaselineProgressPct());
        String notes = record.getNotes();
        String notesPreview = notes == null || notes.isBlank()
            ? ""
            : notes.length() > 80 ? notes.substring(0, 77) + "..." : notes;

        return new MentorStudentResponse(
            learnerId,
            displayName,
            "Developer",
            (int) total,
            progress,
            weak,
            strong,
            active ? "Active" : "Inactive",
            formatRelative(lastSession),
            lastSession,
            record.getCategory(),
            categoryLabel(record.getCategory()),
            record.getInterviewReadinessPct(),
            record.getInterviewTarget() != null ? record.getInterviewTarget() : "",
            notesPreview,
            (int) taskCount,
            (int) pendingTasks,
            improvement
        );
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private List<MentorStudentSessionHistoryItem> buildSessionHistory(List<MentorshipBooking> bookings) {
        ZoneId zone = ZoneId.systemDefault();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d, yyyy · h:mm a", Locale.US);
        return bookings.stream()
            .map(b -> new MentorStudentSessionHistoryItem(
                b.getId(),
                b.getBookingCode(),
                sessionTitle(b),
                b.getRequestType() != null ? b.getRequestType() : "mentorship",
                b.getStatus(),
                b.getScheduledAt().atZone(zone).format(fmt),
                b.getDurationMinutes(),
                b.getScheduledAt()
            ))
            .toList();
    }

    private List<MentorStudentImprovementPoint> buildImprovementTrend(
        List<MentorshipBooking> bookings,
        int baseline
    ) {
        List<MentorshipBooking> completed = bookings.stream()
            .filter(b -> "completed".equals(b.getStatus()))
            .sorted(Comparator.comparing(MentorshipBooking::getScheduledAt))
            .toList();

        List<MentorStudentImprovementPoint> trend = new ArrayList<>();
        trend.add(new MentorStudentImprovementPoint("Start", baseline));
        if (completed.isEmpty()) {
            trend.add(new MentorStudentImprovementPoint("Now", baseline));
            return trend;
        }

        int step = Math.max(1, completed.size() / 4);
        for (int i = 0; i < completed.size(); i += step) {
            int pct = (int) Math.min(100, Math.round(((i + 1) * 100.0) / bookings.size()));
            MentorshipBooking b = completed.get(i);
            String label = b.getScheduledAt().atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM d", Locale.US));
            trend.add(new MentorStudentImprovementPoint(label, pct));
        }
        int current = (int) Math.min(100, Math.round((completed.size() * 100.0) / bookings.size()));
        trend.add(new MentorStudentImprovementPoint("Now", current));
        return trend;
    }

    private MentorStudentTaskResponse toTaskResponse(MentorStudentTask task) {
        return new MentorStudentTaskResponse(
            task.getId(),
            task.getTitle(),
            task.getDescription() != null ? task.getDescription() : "",
            task.getStatus(),
            task.getDueDate(),
            task.getDueDate() != null
                ? task.getDueDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US))
                : "",
            task.getCreatedAt()
        );
    }

    private MentorStudentRoadmapItemResponse toRoadmapResponse(MentorStudentRoadmapItem item) {
        return new MentorStudentRoadmapItemResponse(
            item.getId(),
            item.getTitle(),
            item.getMilestone() != null ? item.getMilestone() : "",
            item.getSortOrder(),
            item.getStatus()
        );
    }

    private String sessionTitle(MentorshipBooking booking) {
        if (booking.getRequestMessage() != null && !booking.getRequestMessage().isBlank()) {
            String msg = booking.getRequestMessage();
            return msg.length() > 60 ? msg.substring(0, 57) + "..." : msg;
        }
        if (booking.getNotes() != null && !booking.getNotes().isBlank()) {
            return booking.getNotes();
        }
        return "Mentorship session";
    }

    private String defaultCategory(MentorshipBooking booking) {
        String type = booking.getRequestType();
        if (type == null) {
            return "active_project";
        }
        return switch (type) {
            case "mock-interview", "system-design" -> "interview_prep";
            case "career-guidance" -> "job_seeker";
            case "project-help", "code-review" -> "active_project";
            default -> "beginner";
        };
    }

    private int estimateInterviewReadiness(MentorshipBooking booking) {
        if ("mock-interview".equals(booking.getRequestType())) {
            return 55;
        }
        if ("system-design".equals(booking.getRequestType())) {
            return 48;
        }
        return 35;
    }

    private String normalizeCategory(String category) {
        String normalized = category.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        if (!CATEGORY_LABELS.containsKey(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category");
        }
        return normalized;
    }

    private String categoryLabel(String category) {
        return CATEGORY_LABELS.getOrDefault(category, "Active Project");
    }

    private String normalizeTaskStatus(String status) {
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("pending", "in_progress", "completed").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid task status");
        }
        return normalized;
    }

    private String normalizeRoadmapStatus(String status) {
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("locked", "active", "completed").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roadmap status");
        }
        return normalized;
    }

    private void requireApprovedMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }
    }

    private String formatRelative(Instant instant) {
        if (instant == null) {
            return "Never";
        }
        Duration delta = Duration.between(instant, Instant.now()).abs();
        if (delta.toMinutes() < 60) {
            return "Today";
        }
        if (delta.toHours() < 48) {
            return "Yesterday";
        }
        if (delta.toDays() < 7) {
            return delta.toDays() + "d ago";
        }
        if (delta.toDays() < 30) {
            return (delta.toDays() / 7) + "w ago";
        }
        return instant.atZone(ZoneId.systemDefault())
            .format(DateTimeFormatter.ofPattern("MMM d", Locale.US));
    }
}
