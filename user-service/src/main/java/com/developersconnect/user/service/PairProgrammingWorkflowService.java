package com.developersconnect.user.service;

import com.developersconnect.user.dto.PairProgrammingDtos.PairSessionResponse;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.model.PairParticipant;
import com.developersconnect.user.model.PairProgrammingInvitation;
import com.developersconnect.user.model.PairProgrammingSession;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.PairParticipantRepository;
import com.developersconnect.user.repository.PairProgrammingInvitationRepository;
import com.developersconnect.user.repository.PairProgrammingSessionRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PairProgrammingWorkflowService {

    public record StartMentorSessionRequest(
        UUID mentorId,
        UUID problemId,
        String language,
        String role
    ) {}

    public record InvitationResponse(
        UUID id,
        UUID sessionId,
        String sessionCode,
        UUID senderId,
        String senderName,
        String language,
        String challenge,
        String role,
        String difficulty,
        String status,
        String createdAt
    ) {}

    private final PairProgrammingSessionRepository sessionRepository;
    private final PairProgrammingInvitationRepository invitationRepository;
    private final PairParticipantRepository participantRepository;
    private final UserProfileRepository profileRepository;
    private final PairProgrammingService pairProgrammingService;
    private final PairProgrammingNotificationService notificationService;
    private final MentorRelationshipClient mentorRelationshipClient;
    private final CodingProblemService codingProblemService;

    public PairProgrammingWorkflowService(
        PairProgrammingSessionRepository sessionRepository,
        PairProgrammingInvitationRepository invitationRepository,
        PairParticipantRepository participantRepository,
        UserProfileRepository profileRepository,
        PairProgrammingService pairProgrammingService,
        PairProgrammingNotificationService notificationService,
        MentorRelationshipClient mentorRelationshipClient,
        CodingProblemService codingProblemService
    ) {
        this.sessionRepository = sessionRepository;
        this.invitationRepository = invitationRepository;
        this.participantRepository = participantRepository;
        this.profileRepository = profileRepository;
        this.pairProgrammingService = pairProgrammingService;
        this.notificationService = notificationService;
        this.mentorRelationshipClient = mentorRelationshipClient;
        this.codingProblemService = codingProblemService;
    }

    @Transactional
    public PairSessionResponse startMentorSession(
        UUID studentId,
        String studentName,
        StartMentorSessionRequest request,
        String bearerToken
    ) {
        if (request.mentorId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mentor is required");
        }
        if (!mentorRelationshipClient.hasActiveRelationship(request.mentorId(), studentId, bearerToken)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only start pair programming with an accepted mentor"
            );
        }

        if (request.problemId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem is required");
        }
        CodingChallenge challenge = codingProblemService.requirePublishedProblem(request.problemId());
        String language = trim(request.language(), "java");
        String starterCode = codingProblemService.starterCodeFor(challenge, language);

        PairProgrammingSession session = new PairProgrammingSession();
        session.setCreatorId(studentId);
        session.setHostId(studentId);
        session.setStudentId(studentId);
        session.setMentorId(request.mentorId());
        session.setProblemId(challenge.getId().toString());
        session.setProblemTitle(challenge.getTitle());
        session.setProblemDescription(challenge.getDescription());
        session.setLanguage(language);
        session.setDifficulty(challenge.getDifficulty());
        session.setHostRole(trim(request.role(), "driver"));
        session.setCurrentCode(starterCode);
        session.setMode(PairProgrammingSession.MODE_PAIR);
        session.setStatus(PairProgrammingSession.STATUS_WAITING);
        PairProgrammingSession saved = sessionRepository.save(session);

        addParticipant(saved.getId(), studentId, studentName, trim(request.role(), "driver"));
        String mentorName = lookupName(request.mentorId());
        addParticipant(saved.getId(), request.mentorId(), mentorName, "mentor");

        PairProgrammingInvitation invitation = new PairProgrammingInvitation();
        invitation.setSessionId(saved.getId());
        invitation.setSenderId(studentId);
        invitation.setReceiverId(request.mentorId());
        invitation.setStatus(PairProgrammingInvitation.STATUS_PENDING);
        invitationRepository.save(invitation);

        notificationService.notifyUser(
            request.mentorId(),
            "New Pair Programming Request",
            studentName + " invited you to a pair session: " + saved.getProblemTitle(),
            "pair_programming_request"
        );

        return pairProgrammingService.toResponsePublic(saved, studentId);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> listIncomingInvitations(UUID mentorId) {
        return invitationRepository
            .findByReceiverIdAndStatusOrderByCreatedAtDesc(mentorId, PairProgrammingInvitation.STATUS_PENDING)
            .stream()
            .map(this::toInvitationResponse)
            .toList();
    }

    @Transactional
    public PairSessionResponse acceptInvitation(UUID mentorId, UUID sessionId) {
        PairProgrammingInvitation invitation = requirePendingInvitation(sessionId, mentorId);
        PairProgrammingSession session = requireSession(sessionId);

        invitation.setStatus(PairProgrammingInvitation.STATUS_ACCEPTED);
        invitation.setRespondedAt(Instant.now());
        invitationRepository.save(invitation);

        session.setStatus(PairProgrammingSession.STATUS_ACTIVE);
        session.setStartedAt(Instant.now());
        sessionRepository.save(session);

        notificationService.notifyUser(
            session.getStudentId(),
            "Pair session accepted",
            "Your pair programming session has been accepted.",
            "pair_programming_accepted"
        );

        return pairProgrammingService.toResponsePublic(session, mentorId);
    }

    @Transactional
    public PairSessionResponse rejectInvitation(UUID mentorId, UUID sessionId) {
        PairProgrammingInvitation invitation = requirePendingInvitation(sessionId, mentorId);
        PairProgrammingSession session = requireSession(sessionId);

        invitation.setStatus(PairProgrammingInvitation.STATUS_REJECTED);
        invitation.setRespondedAt(Instant.now());
        invitationRepository.save(invitation);

        session.setStatus(PairProgrammingSession.STATUS_CANCELLED);
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);

        notificationService.notifyUser(
            session.getStudentId(),
            "Pair session declined",
            "Your pair programming request was declined.",
            "pair_programming_rejected"
        );

        return pairProgrammingService.toResponsePublic(session, mentorId);
    }

    @Transactional(readOnly = true)
    public PairSessionResponse getSessionByCode(String code, UUID userId) {
        PairProgrammingSession session = sessionRepository.findBySessionCodeIgnoreCase(normalizeCode(code))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        assertCanAccess(session, userId);
        return pairProgrammingService.toResponsePublic(session, userId);
    }

    @Transactional
    public PairSessionResponse joinByCode(String code, UUID userId, String displayName) {
        PairProgrammingSession session = sessionRepository.findBySessionCodeIgnoreCase(normalizeCode(code))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (PairProgrammingSession.STATUS_COMPLETED.equals(session.getStatus())
            || PairProgrammingSession.STATUS_CANCELLED.equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session already ended");
        }

        if (PairProgrammingSession.STATUS_WAITING.equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Session is waiting for mentor approval");
        }

        participantRepository.findBySessionIdAndUserIdAndLeftAtIsNull(session.getId(), userId)
            .orElseGet(() -> {
                String role = userId.equals(session.getMentorId()) ? "mentor"
                    : userId.equals(session.getStudentId()) ? session.getHostRole() : "observer";
                return addParticipant(session.getId(), userId, displayName, role);
            });

        return pairProgrammingService.toResponsePublic(session, userId);
    }

    private PairProgrammingInvitation requirePendingInvitation(UUID sessionId, UUID mentorId) {
        PairProgrammingInvitation invitation = invitationRepository
            .findBySessionIdAndReceiverId(sessionId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (!PairProgrammingInvitation.STATUS_PENDING.equals(invitation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invitation is not pending");
        }
        return invitation;
    }

    private PairProgrammingSession requireSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    private void assertCanAccess(PairProgrammingSession session, UUID userId) {
        boolean allowed = userId.equals(session.getStudentId())
            || userId.equals(session.getMentorId())
            || userId.equals(session.getCreatorId())
            || participantRepository.findBySessionIdAndUserIdAndLeftAtIsNull(session.getId(), userId).isPresent();
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view this session");
        }
    }

    private InvitationResponse toInvitationResponse(PairProgrammingInvitation invitation) {
        PairProgrammingSession session = requireSession(invitation.getSessionId());
        return new InvitationResponse(
            invitation.getId(),
            session.getId(),
            session.getSessionCode(),
            invitation.getSenderId(),
            lookupName(invitation.getSenderId()),
            session.getLanguage(),
            session.getProblemTitle(),
            session.getHostRole(),
            session.getDifficulty(),
            invitation.getStatus(),
            invitation.getCreatedAt().toString()
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

    private String lookupName(UUID userId) {
        return profileRepository.findById(userId).map(UserProfile::getDisplayName).orElse("Developer");
    }

    private String trim(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }

    private String normalizeCode(String code) {
        return code != null ? code.trim().toUpperCase() : "";
    }
}
