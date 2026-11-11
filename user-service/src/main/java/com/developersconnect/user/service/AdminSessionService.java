package com.developersconnect.user.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.dto.CreateSessionReportRequest;
import com.developersconnect.user.dto.PlatformSessionResponse;
import com.developersconnect.user.dto.SessionReportResponse;
import com.developersconnect.user.dto.UpdatePlatformSessionRequest;
import com.developersconnect.user.model.PlatformSession;
import com.developersconnect.user.model.SessionReport;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.repository.PlatformSessionRepository;
import com.developersconnect.user.repository.SessionReportRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import com.developersconnect.user.repository.VideoRoomRepository;

@Service
public class AdminSessionService {

    private static final Set<String> SESSION_TYPES = Set.of(
        "video_call", "mentorship", "interview", "coding"
    );

    private final PlatformSessionRepository sessionRepository;
    private final SessionReportRepository reportRepository;
    private final VideoRoomRepository roomRepository;
    private final VideoRoomParticipantRepository participantRepository;
    private final UserProfileRepository userProfileRepository;
    private final VideoRoomService videoRoomService;

    public AdminSessionService(
        PlatformSessionRepository sessionRepository,
        SessionReportRepository reportRepository,
        VideoRoomRepository roomRepository,
        VideoRoomParticipantRepository participantRepository,
        UserProfileRepository userProfileRepository,
        VideoRoomService videoRoomService
    ) {
        this.sessionRepository = sessionRepository;
        this.reportRepository = reportRepository;
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.userProfileRepository = userProfileRepository;
        this.videoRoomService = videoRoomService;
    }

    @Transactional
    public void syncFromVideoRooms() {
        for (String status : List.of("live", "ended")) {
            List<VideoRoom> rooms = roomRepository.findAllByParentRoomIdIsNullAndStatusOrderByCreatedAtDesc(
                status, PageRequest.of(0, 200)
            );
            for (VideoRoom room : rooms) {
                upsertFromRoom(room);
            }
        }
    }

    @Transactional
    public List<PlatformSessionResponse> listSessions(
        String status,
        String sessionType,
        String query,
        int limit
    ) {
        syncFromVideoRooms();
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        String normalizedStatus = normalizeStatus(status);
        String normalizedType = sessionType != null && !sessionType.isBlank() && !"all".equalsIgnoreCase(sessionType)
            ? normalizeSessionType(sessionType)
            : null;
        String q = query != null && !query.isBlank() ? query.trim() : null;

        List<PlatformSession> sessions = sessionRepository.search(
            normalizedStatus,
            normalizedType,
            q,
            PageRequest.of(0, safeLimit)
        );

        return sessions.stream().map(s -> toResponse(s, false)).toList();
    }

    @Transactional
    public PlatformSessionResponse getSession(UUID sessionId) {
        PlatformSession session = findSession(sessionId);
        refreshDuration(session);
        return toResponse(session, true);
    }

    @Transactional
    public PlatformSessionResponse updateSession(
        UUID sessionId,
        String roles,
        UpdatePlatformSessionRequest request
    ) {
        requireAdmin(roles);
        PlatformSession session = findSession(sessionId);
        if (request.qualityScore() != null) {
            session.setQualityScore(clampQuality(request.qualityScore()));
        }
        if (request.recordingAvailable() != null) {
            session.setRecordingAvailable(request.recordingAvailable());
        }
        if (request.recordingUrl() != null) {
            session.setRecordingUrl(request.recordingUrl().isBlank() ? null : request.recordingUrl().trim());
        }
        if (request.aiModerationEnabled() != null) {
            session.setAiModerationEnabled(request.aiModerationEnabled());
        }
        if (request.moderationStatus() != null) {
            session.setModerationStatus(normalizeModeration(request.moderationStatus()));
        }
        return toResponse(sessionRepository.save(session), true);
    }

    @Transactional
    public PlatformSessionResponse endSession(UUID sessionId, UUID actorId, String roles) {
        PlatformSession session = findSession(sessionId);
        if (!canManage(session, actorId, roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only host or admin can end session");
        }
        session.setStatus("ended");
        session.setEndedAt(Instant.now());
        refreshDuration(session);
        sessionRepository.save(session);

        if (session.getLinkedRoomId() != null) {
            try {
                videoRoomService.endRoom(session.getLinkedRoomId(), actorId, roles);
            } catch (ResponseStatusException ignored) {
                // Room may already be ended
            }
        }
        return toResponse(session, true);
    }

    @Transactional
    public PlatformSessionResponse addReport(
        UUID sessionId,
        UUID reporterId,
        CreateSessionReportRequest request
    ) {
        PlatformSession session = findSession(sessionId);
        SessionReport report = new SessionReport();
        report.setSessionId(sessionId);
        report.setReporterId(reporterId);
        report.setReason(request.reason().trim());
        report.setDetails(request.details() != null ? request.details().trim() : null);
        reportRepository.save(report);

        long count = reportRepository.countBySessionId(sessionId);
        session.setReportCount((int) count);
        if (count >= 2) {
            session.setModerationStatus("flagged");
        } else if (count == 1) {
            session.setModerationStatus("review");
        }
        return toResponse(sessionRepository.save(session), true);
    }

    @Transactional
    public PlatformSessionResponse runAiModeration(UUID sessionId, String roles) {
        requireAdmin(roles);
        PlatformSession session = findSession(sessionId);
        if (!session.isAiModerationEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AI moderation is disabled for this session");
        }

        String title = session.getTitle() != null ? session.getTitle() : "";
        String desc = session.getDescription() != null ? session.getDescription() : "";
        String hay = (title + " " + desc).toLowerCase(Locale.ROOT);
        boolean flagged = session.getReportCount() > 0
            || hay.contains("inappropriate")
            || hay.contains("spam")
            || hay.contains("harassment")
            || session.getQualityScore() < 50;

        session.setModerationStatus(flagged ? "flagged" : "clear");
        if (flagged && session.getQualityScore() > 60) {
            session.setQualityScore(55);
        }
        return toResponse(sessionRepository.save(session), true);
    }

    private void upsertFromRoom(VideoRoom room) {
        PlatformSession session = sessionRepository.findByLinkedRoomId(room.getId()).orElseGet(PlatformSession::new);
        if (session.getId() == null) {
            session.setStartedAt(room.getCreatedAt());
        }
        session.setLinkedRoomId(room.getId());
        session.setHostId(room.getHostId());
        session.setTitle(room.getTitle());
        session.setDescription(room.getDescription());
        session.setSessionType(mapRoomToSessionType(room));
        session.setStatus(room.getStatus());
        session.setMaxParticipants(room.getMaxParticipants());
        session.setParticipantCount((int) participantRepository.countByRoomIdAndLeftAtIsNull(room.getId()));
        session.setEndedAt(room.getEndedAt());
        refreshDurationFor(session, room.getCreatedAt(), room.getEndedAt(), room.getStatus());
        if (session.getRecordingUrl() == null && "ended".equals(room.getStatus())) {
            session.setRecordingAvailable(true);
            session.setRecordingUrl("/recordings/" + room.getId() + ".mp4");
        }
        sessionRepository.save(session);
    }

    private String mapRoomToSessionType(VideoRoom room) {
        String roomType = room.getRoomType() != null ? room.getRoomType().toLowerCase(Locale.ROOT) : "";
        String useCase = room.getUseCase() != null ? room.getUseCase().toLowerCase(Locale.ROOT) : "";
        String category = room.getCategory() != null ? room.getCategory().toLowerCase(Locale.ROOT) : "";

        if ("interview".equals(roomType) || category.contains("interview")) {
            return "interview";
        }
        if ("mentoring".equals(useCase) || category.contains("mentor")) {
            return "mentorship";
        }
        if (category.contains("coding") || category.contains("dsa") || category.contains("algorithm")) {
            return "coding";
        }
        return "video_call";
    }

    private void refreshDuration(PlatformSession session) {
        Instant end = session.getEndedAt() != null ? session.getEndedAt() : Instant.now();
        refreshDurationFor(session, session.getStartedAt(), end, session.getStatus());
    }

    private void refreshDurationFor(PlatformSession session, Instant start, Instant end, String status) {
        if (start == null) {
            session.setDurationSeconds(0);
            return;
        }
        Instant effectiveEnd = "live".equals(status) ? Instant.now() : (end != null ? end : Instant.now());
        session.setDurationSeconds(Math.max(0, Duration.between(start, effectiveEnd).getSeconds()));
    }

    private PlatformSession findSession(UUID id) {
        return sessionRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    private PlatformSessionResponse toResponse(PlatformSession session, boolean includeReports) {
        UserProfile host = userProfileRepository.findById(session.getHostId()).orElse(null);
        String hostName = displayName(host);
        List<SessionReportResponse> reports = includeReports
            ? reportRepository.findAllBySessionIdOrderByCreatedAtDesc(session.getId()).stream()
                .map(this::toReportResponse)
                .toList()
            : List.of();

        return new PlatformSessionResponse(
            session.getId(),
            session.getSessionType(),
            session.getTitle(),
            session.getDescription(),
            session.getHostId(),
            hostName,
            session.getStatus(),
            session.getParticipantCount(),
            session.getMaxParticipants(),
            session.getQualityScore(),
            session.getDurationSeconds(),
            formatDuration(session.getDurationSeconds()),
            session.getRecordingUrl(),
            session.isRecordingAvailable(),
            session.isAiModerationEnabled(),
            session.getModerationStatus(),
            session.getReportCount(),
            session.getLinkedRoomId(),
            session.getLinkedMatchRequestId(),
            session.getStartedAt(),
            session.getEndedAt(),
            reports
        );
    }

    private SessionReportResponse toReportResponse(SessionReport report) {
        String label = "Anonymous";
        if (report.getReporterId() != null) {
            String id = report.getReporterId().toString().replace("-", "");
            label = "User " + id.substring(0, Math.min(8, id.length()));
        }
        return new SessionReportResponse(
            report.getId(),
            report.getReason(),
            report.getDetails(),
            label,
            report.getCreatedAt()
        );
    }

    private String formatDuration(long seconds) {
        long h = seconds / 3600;
        long m = (seconds % 3600) / 60;
        long s = seconds % 60;
        if (h > 0) {
            return String.format("%dh %dm", h, m);
        }
        if (m > 0) {
            return String.format("%dm %ds", m, s);
        }
        return s + "s";
    }

    private String displayName(UserProfile profile) {
        if (profile == null) {
            return "Developer";
        }
        if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName();
        }
        return profile.getUsername();
    }

    private boolean canManage(PlatformSession session, UUID userId, String roles) {
        return session.getHostId().equals(userId) || isAdmin(roles);
    }

    private void requireAdmin(String roles) {
        if (!isAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }

    private boolean isAdmin(String roles) {
        if (roles == null || roles.isBlank()) {
            return false;
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        return upper.contains("ADMIN") || upper.contains("MODERATOR");
    }

    private int clampQuality(int score) {
        return Math.min(100, Math.max(0, score));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return null;
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSessionType(String type) {
        String t = type.trim().toLowerCase(Locale.ROOT);
        return SESSION_TYPES.contains(t) ? t : "video_call";
    }

    private String normalizeModeration(String status) {
        String s = status.trim().toLowerCase(Locale.ROOT);
        if (Set.of("clear", "review", "flagged").contains(s)) {
            return s;
        }
        return "review";
    }
}
