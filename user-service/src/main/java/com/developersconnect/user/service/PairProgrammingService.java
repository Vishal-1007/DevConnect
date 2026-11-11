package com.developersconnect.user.service;

import com.developersconnect.user.dto.PairProgrammingDtos.JoinPairSessionRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.PairChatMessageResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.PairParticipantResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.PairSessionResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.ResourceLinkResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.SavePairCodeRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SavePairNoteRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SaveWhiteboardRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SendPairChatRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SessionSummaryResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.StartPairSessionRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.StopRecordingRequest;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.model.PairChatMessage;
import com.developersconnect.user.model.PairCodeSnapshot;
import com.developersconnect.user.model.PairParticipant;
import com.developersconnect.user.model.PairProgrammingSession;
import com.developersconnect.user.model.PairSessionNote;
import com.developersconnect.user.model.PairSessionRecording;
import com.developersconnect.user.model.PairWhiteboardData;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.PairChatMessageRepository;
import com.developersconnect.user.repository.PairCodeSnapshotRepository;
import com.developersconnect.user.repository.PairParticipantRepository;
import com.developersconnect.user.repository.PairProgrammingSessionRepository;
import com.developersconnect.user.repository.PairSessionNoteRepository;
import com.developersconnect.user.repository.PairSessionRecordingRepository;
import com.developersconnect.user.repository.PairWhiteboardDataRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PairProgrammingService {

    private final PairProgrammingSessionRepository sessionRepository;
    private final PairParticipantRepository participantRepository;
    private final PairCodeSnapshotRepository snapshotRepository;
    private final PairChatMessageRepository chatRepository;
    private final PairSessionNoteRepository noteRepository;
    private final PairWhiteboardDataRepository whiteboardRepository;
    private final PairSessionRecordingRepository recordingRepository;
    private final UserProfileRepository profileRepository;
    private final PairCodeRunnerService codeRunnerService;
    private final CodingProblemService codingProblemService;
    private final UserStreakService userStreakService;

    public PairProgrammingService(
        PairProgrammingSessionRepository sessionRepository,
        PairParticipantRepository participantRepository,
        PairCodeSnapshotRepository snapshotRepository,
        PairChatMessageRepository chatRepository,
        PairSessionNoteRepository noteRepository,
        PairWhiteboardDataRepository whiteboardRepository,
        PairSessionRecordingRepository recordingRepository,
        UserProfileRepository profileRepository,
        PairCodeRunnerService codeRunnerService,
        CodingProblemService codingProblemService,
        UserStreakService userStreakService
    ) {
        this.sessionRepository = sessionRepository;
        this.participantRepository = participantRepository;
        this.snapshotRepository = snapshotRepository;
        this.chatRepository = chatRepository;
        this.noteRepository = noteRepository;
        this.whiteboardRepository = whiteboardRepository;
        this.recordingRepository = recordingRepository;
        this.profileRepository = profileRepository;
        this.codeRunnerService = codeRunnerService;
        this.codingProblemService = codingProblemService;
        this.userStreakService = userStreakService;
    }

    @Transactional
    public PairSessionResponse startSession(UUID userId, String displayName, StartPairSessionRequest request) {
        if (request.assignmentId() != null) {
            var existing = sessionRepository.findByAssignmentId(request.assignmentId());
            if (existing.isPresent()) {
                return toResponse(existing.get(), userId);
            }
        }

        if (request.problemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem is required");
        }
        CodingChallenge challenge = codingProblemService.requirePublishedProblem(request.problemId());
        String language = trim(request.language(), "java");
        String starterCode = codingProblemService.starterCodeFor(challenge, language);

        PairProgrammingSession session = new PairProgrammingSession();
        session.setHostId(userId);
        session.setCreatorId(userId);
        session.setStudentId(userId);
        session.setProblemId(challenge.getId().toString());
        session.setProblemTitle(challenge.getTitle());
        session.setProblemDescription(challenge.getDescription());
        session.setLanguage(language);
        session.setDifficulty(challenge.getDifficulty());
        session.setHostRole(trim(request.role(), "driver"));
        session.setCurrentCode(starterCode);
        session.setAllowMentorEdit(request.allowMentorEdit());
        session.setMode(PairProgrammingSession.MODE_PAIR);
        session.setAssignmentId(request.assignmentId());
        if (request.partnerRole() != null && "mentor".equalsIgnoreCase(request.partnerRole())) {
            session.setMentorId(request.partnerId());
        }
        session.setStatus(PairProgrammingSession.STATUS_ACTIVE);
        session.setStartedAt(Instant.now());
        PairProgrammingSession saved = sessionRepository.save(session);

        addParticipant(saved.getId(), userId, displayName, mapRole(request.role(), true));
        if (request.partnerId() != null) {
            String partnerRole = request.partnerRole() != null ? request.partnerRole() : oppositeRole(request.role());
            addParticipant(saved.getId(), request.partnerId(), request.partnerName(), mapRole(partnerRole, false));
        }

        ensureNote(saved.getId());
        ensureWhiteboard(saved.getId());
        saveSnapshot(saved.getId(), userId, saved.getCurrentCode(), saved.getLanguage());

        return toResponse(saved, userId);
    }

    @Transactional
    public PairSessionResponse joinSession(UUID userId, String displayName, JoinPairSessionRequest request) {
        PairProgrammingSession session = sessionRepository.findBySessionCodeIgnoreCase(request.sessionCode().trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if (PairProgrammingSession.STATUS_COMPLETED.equals(session.getStatus())
            || PairProgrammingSession.STATUS_CANCELLED.equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already ended");
        }
        participantRepository.findBySessionIdAndUserIdAndLeftAtIsNull(session.getId(), userId)
            .orElseGet(() -> addParticipant(session.getId(), userId, displayName, "navigator"));
        if (PairProgrammingSession.STATUS_WAITING.equals(session.getStatus())) {
            session.setStatus(PairProgrammingSession.STATUS_ACTIVE);
            session.setStartedAt(Instant.now());
            sessionRepository.save(session);
        }
        return toResponse(session, userId);
    }

    @Transactional(readOnly = true)
    public PairSessionResponse getSession(UUID sessionId, UUID userId) {
        return toResponse(requireSession(sessionId), userId);
    }

    @Transactional
    public PairSessionResponse saveCode(UUID sessionId, UUID userId, SavePairCodeRequest request) {
        PairProgrammingSession session = requireSession(sessionId);
        assertParticipant(sessionId, userId);
        assertCanEdit(session, userId);
        session.setCurrentCode(request.code());
        session.setLanguage(request.language());
        sessionRepository.save(session);
        saveSnapshot(sessionId, userId, request.code(), request.language());
        return toResponse(session, userId);
    }

    @Transactional(readOnly = true)
    public RunPairCodeResponse runCode(UUID sessionId, UUID userId, RunPairCodeRequest request) {
        PairProgrammingSession session = requireSession(sessionId);
        assertParticipant(sessionId, userId);
        assertCanEdit(session, userId);
        RunPairCodeResponse result = codeRunnerService.run(request.code(), request.language(), request.problemId() != null
            ? request.problemId()
            : session.getProblemId());
        if (result.allPassed()) {
            try {
                codingProblemService.markSolved(userId, UUID.fromString(session.getProblemId()), session.getLanguage());
            } catch (IllegalArgumentException ignored) {
                // Legacy session problem ids are not UUIDs
            }
        }
        return result;
    }

    @Transactional
    public PairChatMessageResponse sendChat(UUID sessionId, UUID userId, String displayName, SendPairChatRequest request) {
        assertParticipant(sessionId, userId);
        PairChatMessage message = new PairChatMessage();
        message.setSessionId(sessionId);
        message.setSenderId(userId);
        message.setSenderName(displayName);
        message.setMessage(request.message().trim());
        message.setMessageType(request.messageType() != null ? request.messageType() : "text");
        PairChatMessage saved = chatRepository.save(message);
        return toChatResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PairChatMessageResponse> listChat(UUID sessionId, UUID userId) {
        assertParticipant(sessionId, userId);
        return chatRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
            .map(this::toChatResponse)
            .toList();
    }

    @Transactional
    public PairSessionResponse saveNote(UUID sessionId, UUID userId, SavePairNoteRequest request) {
        assertParticipant(sessionId, userId);
        PairSessionNote note = noteRepository.findBySessionId(sessionId).orElseGet(() -> ensureNote(sessionId));
        note.setContent(request.content());
        note.setUpdatedBy(userId);
        noteRepository.save(note);
        return toResponse(requireSession(sessionId), userId);
    }

    @Transactional
    public PairSessionResponse saveWhiteboard(UUID sessionId, UUID userId, SaveWhiteboardRequest request) {
        assertParticipant(sessionId, userId);
        PairWhiteboardData board = whiteboardRepository.findBySessionId(sessionId)
            .orElseGet(() -> ensureWhiteboard(sessionId));
        board.setJsonData(request.jsonData());
        whiteboardRepository.save(board);
        return toResponse(requireSession(sessionId), userId);
    }

    @Transactional
    public PairSessionRecording startRecording(UUID sessionId, UUID userId) {
        assertParticipant(sessionId, userId);
        recordingRepository.findFirstBySessionIdAndStatusOrderByStartedAtDesc(
            sessionId, PairSessionRecording.STATUS_RECORDING
        ).ifPresent(active -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Recording already in progress");
        });
        PairSessionRecording recording = new PairSessionRecording();
        recording.setSessionId(sessionId);
        recording.setStatus(PairSessionRecording.STATUS_RECORDING);
        return recordingRepository.save(recording);
    }

    @Transactional
    public PairSessionRecording stopRecording(UUID sessionId, UUID userId, StopRecordingRequest request) {
        assertParticipant(sessionId, userId);
        PairSessionRecording recording = recordingRepository
            .findFirstBySessionIdAndStatusOrderByStartedAtDesc(sessionId, PairSessionRecording.STATUS_RECORDING)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active recording"));
        recording.setStatus(PairSessionRecording.STATUS_STOPPED);
        recording.setStoppedAt(Instant.now());
        recording.setVideoUrl(request.videoUrl());
        return recordingRepository.save(recording);
    }

    @Transactional
    public SessionSummaryResponse endSession(UUID sessionId, UUID userId) {
        PairProgrammingSession session = requireSession(sessionId);
        assertParticipant(sessionId, userId);
        session.setStatus(PairProgrammingSession.STATUS_COMPLETED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);

        userStreakService.recordActivity(userId);
        participantRepository.findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(sessionId)
            .forEach(participant -> userStreakService.recordActivity(participant.getUserId()));

        participantRepository.findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(sessionId)
            .forEach(participant -> participant.setLeftAt(Instant.now()));

        long duration = session.getStartedAt() != null
            ? Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds()
            : 0;
        RunPairCodeResponse runResult = codeRunnerService.run(
            session.getCurrentCode(), session.getLanguage(), session.getProblemId()
        );
        boolean solved = runResult.allPassed();
        if (solved) {
            try {
                codingProblemService.markSolved(userId, UUID.fromString(session.getProblemId()), session.getLanguage());
            } catch (IllegalArgumentException ignored) {
                // Legacy session problem ids are not UUIDs
            }
        }
        int quality = estimateCodeQuality(session.getCurrentCode());
        int points = 50 + (solved ? 100 : 0);

        return new SessionSummaryResponse(
            sessionId,
            duration,
            session.getProblemTitle(),
            session.getLanguage(),
            solved,
            quality,
            points,
            solved ? "Strong collaboration and working solution." : "Good effort — review edge cases together.",
            List.of("Clear communication", solved ? "Correct algorithm choice" : "Persistent debugging"),
            List.of(solved ? "Minor style improvements" : "Test coverage"),
            List.of("Practice more medium problems", "Switch driver/navigator more often")
        );
    }

    private PairParticipant addParticipant(UUID sessionId, UUID userId, String displayName, String role) {
        PairParticipant participant = new PairParticipant();
        participant.setSessionId(sessionId);
        participant.setUserId(userId);
        participant.setDisplayName(displayName != null ? displayName : lookupName(userId));
        participant.setRole(role);
        return participantRepository.save(participant);
    }

    private PairSessionNote ensureNote(UUID sessionId) {
        return noteRepository.findBySessionId(sessionId).orElseGet(() -> {
            PairSessionNote note = new PairSessionNote();
            note.setSessionId(sessionId);
            note.setContent("");
            return noteRepository.save(note);
        });
    }

    private PairWhiteboardData ensureWhiteboard(UUID sessionId) {
        return whiteboardRepository.findBySessionId(sessionId).orElseGet(() -> {
            PairWhiteboardData board = new PairWhiteboardData();
            board.setSessionId(sessionId);
            board.setJsonData("[]");
            return whiteboardRepository.save(board);
        });
    }

    private void saveSnapshot(UUID sessionId, UUID userId, String code, String language) {
        PairCodeSnapshot snapshot = new PairCodeSnapshot();
        snapshot.setSessionId(sessionId);
        snapshot.setContent(code);
        snapshot.setLanguage(language);
        snapshot.setSavedBy(userId);
        snapshotRepository.save(snapshot);
    }

    private PairProgrammingSession requireSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    private void assertParticipant(UUID sessionId, UUID userId) {
        participantRepository.findBySessionIdAndUserIdAndLeftAtIsNull(sessionId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a session participant"));
    }

    private void assertCanEdit(PairProgrammingSession session, UUID userId) {
        if (PairProgrammingSession.STATUS_COMPLETED.equals(session.getStatus())
            || PairProgrammingSession.STATUS_CANCELLED.equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session has ended");
        }
        PairParticipant participant = participantRepository
            .findBySessionIdAndUserIdAndLeftAtIsNull(session.getId(), userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a session participant"));
        String role = participant.getRole() != null ? participant.getRole().toLowerCase() : "";
        if ("observer".equals(role) || "viewer".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Read-only for observers");
        }
        if ("driver".equals(role) || "navigator".equals(role) || "mentor".equals(role) || "student".equals(role)) {
            return;
        }
        // Unknown roles default to editable for active participants
    }

    public PairSessionResponse toResponsePublic(PairProgrammingSession session, UUID viewerId) {
        return toResponse(session, viewerId);
    }

    private PairSessionResponse toResponse(PairProgrammingSession session, UUID viewerId) {
        List<PairParticipantResponse> participants = participantRepository
            .findBySessionIdAndLeftAtIsNullOrderByJoinedAtAsc(session.getId())
            .stream()
            .map(p -> new PairParticipantResponse(
                p.getId(), p.getUserId(), p.getDisplayName(), p.getRole(), p.isMicEnabled(), p.isCameraEnabled()
            ))
            .toList();

        String note = noteRepository.findBySessionId(session.getId()).map(PairSessionNote::getContent).orElse("");
        String board = whiteboardRepository.findBySessionId(session.getId())
            .map(PairWhiteboardData::getJsonData).orElse("[]");

        ProblemMeta meta = problemMeta(session.getProblemId());

        return new PairSessionResponse(
            session.getId(),
            session.getSessionCode(),
            session.getHostId(),
            session.getMentorId(),
            session.getAssignmentId(),
            session.getProblemId(),
            session.getProblemTitle(),
            session.getProblemDescription(),
            session.getLanguage(),
            session.getDifficulty(),
            session.getStatus(),
            session.getCurrentCode(),
            session.getHostRole(),
            session.isAllowMentorEdit(),
            session.getMode() != null ? session.getMode() : PairProgrammingSession.MODE_PAIR,
            session.getStartedAt() != null ? session.getStartedAt().toString() : null,
            session.getEndedAt() != null ? session.getEndedAt().toString() : null,
            participants,
            note,
            board,
            meta.hints(),
            meta.constraints(),
            meta.resources()
        );
    }

    private PairChatMessageResponse toChatResponse(PairChatMessage message) {
        return new PairChatMessageResponse(
            message.getId(),
            message.getSenderId(),
            message.getSenderName(),
            message.getMessage(),
            message.getMessageType(),
            message.getCreatedAt().toString()
        );
    }

    private String lookupName(UUID userId) {
        return profileRepository.findById(userId).map(UserProfile::getDisplayName).orElse("Developer");
    }

    private String mapRole(String role, boolean isHost) {
        if (role == null) return isHost ? "driver" : "navigator";
        return role.toLowerCase();
    }

    private String oppositeRole(String role) {
        return "driver".equalsIgnoreCase(role) ? "navigator" : "driver";
    }

    private String trim(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }

    private int estimateCodeQuality(String code) {
        if (code == null || code.isBlank()) return 40;
        int score = 60;
        if (code.contains("for") || code.contains("while")) score += 10;
        if (code.length() > 120) score += 10;
        if (code.contains("return")) score += 10;
        return Math.min(score, 95);
    }

    private ProblemMeta problemMeta(String problemId) {
        if ("two-sum".equalsIgnoreCase(problemId)) {
            return new ProblemMeta(
                List.of("Use a hash map for O(n) time", "Watch duplicate indices"),
                List.of("2 <= nums.length <= 10^4", "Each input has exactly one solution"),
                List.of(
                    new ResourceLinkResponse("Problem Statement", "https://leetcode.com/problems/two-sum/"),
                    new ResourceLinkResponse("HashMap in Java", "https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashMap.html")
                )
            );
        }
        return new ProblemMeta(List.of(), List.of(), List.of());
    }

    private record ProblemMeta(
        List<String> hints,
        List<String> constraints,
        List<ResourceLinkResponse> resources
    ) {}
}
