package com.developersconnect.user.service;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.config.VideoRoomProperties;
import com.developersconnect.user.dto.CreateBreakoutRoomRequest;
import com.developersconnect.user.dto.CreateVideoRoomRequest;
import com.developersconnect.user.dto.SendVideoRoomMessageRequest;
import com.developersconnect.user.dto.SetParticipantCameraRequest;
import com.developersconnect.user.dto.SetParticipantMutedRequest;
import com.developersconnect.user.dto.UpdateVideoRoomPermissionsRequest;
import com.developersconnect.user.dto.VideoRoomJoinPreviewResponse;
import com.developersconnect.user.dto.VideoRoomLimitCheckResponse;
import com.developersconnect.user.dto.VideoRoomMessageResponse;
import com.developersconnect.user.dto.VideoRoomParticipantResponse;
import com.developersconnect.user.dto.VideoRoomResponse;
import com.developersconnect.user.dto.VideoRoomUsageResponse;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.model.VideoRoomMessage;
import com.developersconnect.user.model.VideoRoomParticipant;
import com.developersconnect.user.model.VideoRoomParticipant.ParticipantId;
import com.developersconnect.user.model.VideoRoomParticipantRole;
import com.developersconnect.user.model.VideoRoomParticipantStatus;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.VideoRoomMessageRepository;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import com.developersconnect.user.repository.VideoRoomRepository;

@Service
public class VideoRoomService {

    private static final Set<String> ROOM_TYPES = Set.of("public", "private", "interview", "study_group");
    private static final Set<String> USE_CASES = Set.of("mentoring", "workshop", "teaching", "community");

    private final VideoRoomRepository roomRepository;
    private final VideoRoomParticipantRepository participantRepository;
    private final VideoRoomMessageRepository messageRepository;
    private final UserProfileRepository userProfileRepository;
    private final VideoRoomEntitlementService entitlementService;
    private final VideoRoomNotificationService notificationService;
    private final VideoRoomLobbyBroadcastService lobbyBroadcastService;
    private final VideoRoomInRoomBroadcastService inRoomBroadcastService;
    private final VideoRoomProperties videoRoomProperties;
    private final UserStreakService userStreakService;

    public VideoRoomService(
        VideoRoomRepository roomRepository,
        VideoRoomParticipantRepository participantRepository,
        VideoRoomMessageRepository messageRepository,
        UserProfileRepository userProfileRepository,
        VideoRoomEntitlementService entitlementService,
        VideoRoomNotificationService notificationService,
        VideoRoomLobbyBroadcastService lobbyBroadcastService,
        VideoRoomInRoomBroadcastService inRoomBroadcastService,
        VideoRoomProperties videoRoomProperties,
        UserStreakService userStreakService
    ) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userProfileRepository = userProfileRepository;
        this.entitlementService = entitlementService;
        this.notificationService = notificationService;
        this.lobbyBroadcastService = lobbyBroadcastService;
        this.inRoomBroadcastService = inRoomBroadcastService;
        this.videoRoomProperties = videoRoomProperties;
        this.userStreakService = userStreakService;
    }

    @Transactional(readOnly = true)
    public VideoRoomLimitCheckResponse checkCreateLimit(UUID userId) {
        boolean premium = entitlementService.isPremium(userId);
        if (premium) {
            return new VideoRoomLimitCheckResponse(
                true,
                true,
                "Premium — unlimited room creation.",
                null
            );
        }
        Optional<Instant> nextFree = entitlementService.nextFreeRoomAvailableAt(userId);
        if (nextFree.isEmpty()) {
            return new VideoRoomLimitCheckResponse(
                true,
                false,
                "You can create a free room.",
                null
            );
        }
        return new VideoRoomLimitCheckResponse(
            false,
            false,
            "You already used today's free room. Upgrade for ₹50 unlimited access.",
            nextFree.get()
        );
    }

    @Transactional(readOnly = true)
    public VideoRoomUsageResponse getUsage(UUID userId) {
        boolean premium = entitlementService.isPremium(userId);
        Optional<Instant> nextFree = entitlementService.nextFreeRoomAvailableAt(userId);
        boolean canCreate = premium || nextFree.isEmpty();

        UUID activeFreeRoomId = null;
        Long remaining = null;
        if (!premium) {
            Optional<VideoRoom> active = roomRepository
                .findFirstByHostIdAndStatusAndParentRoomIdIsNullAndPremiumRoomFalseOrderByCreatedAtDesc(userId, "live");
            if (active.isPresent()) {
                activeFreeRoomId = active.get().getId();
                remaining = entitlementService.remainingSeconds(active.get());
            }
        }

        return new VideoRoomUsageResponse(
            premium,
            videoRoomProperties.freeMaxParticipants(),
            videoRoomProperties.freeDurationMinutes(),
            videoRoomProperties.premiumPriceInr(),
            canCreate,
            nextFree.orElse(null),
            activeFreeRoomId,
            remaining
        );
    }

    @Transactional
    public VideoRoomJoinPreviewResponse getJoinPreview(String roomCode) {
        VideoRoom room = findRoomByCode(roomCode);
        refreshExpiryState(room);
        UserProfile host = userProfileRepository.findById(room.getHostId()).orElse(null);
        long count = countActiveParticipants(room.getId());
        return new VideoRoomJoinPreviewResponse(
            room.getId(),
            room.getRoomCode(),
            room.getTitle(),
            displayName(host),
            count,
            room.getMaxParticipants(),
            room.getStatus(),
            count >= room.getMaxParticipants(),
            room.isPremiumRoom(),
            entitlementService.remainingSeconds(room)
        );
    }

    @Transactional
    public VideoRoomResponse joinRoom(UUID roomId, UUID userId, boolean directJoin) {
        VideoRoom room = findRoom(roomId);
        refreshExpiryState(room);
        ensureLive(room);

        Optional<VideoRoomParticipant> existing = participantRepository.findById(new ParticipantId(roomId, userId));
        if (existing.isPresent() && existing.get().getLeftAt() == null) {
            VideoRoomParticipant participant = existing.get();
            if (VideoRoomParticipantStatus.ACTIVE.equals(participant.getStatus())) {
                return toResponse(room, userId, true, true);
            }
            if (VideoRoomParticipantStatus.WAITING.equals(participant.getStatus())) {
                return toResponse(room, userId, true, true);
            }
            if (VideoRoomParticipantStatus.REMOVED.equals(participant.getStatus()) && !directJoin) {
                participant.setStatus(VideoRoomParticipantStatus.WAITING);
                participant.setJoinedAt(Instant.now());
                participantRepository.save(participant);
                notifyJoinRequest(room, participant);
                return toResponse(room, userId, true, true);
            }
        }

        if (directJoin || room.getHostId().equals(userId)) {
            long count = countActiveParticipants(roomId);
            entitlementService.validateJoinCapacity(room, count);
            joinInternal(room, userId, participantRoleForJoin(room, userId), VideoRoomParticipantStatus.ACTIVE);
            lobbyBroadcastService.broadcast("ROOM_JOINED", roomId);
            inRoomBroadcastService.signal(
                "USER_JOINED",
                roomId,
                userId,
                null,
                displayName(userProfileRepository.findById(userId).orElse(null)),
                userId
            );
            return toResponse(room, userId, true, true);
        }

        long count = countActiveParticipants(roomId);
        entitlementService.validateJoinCapacity(room, count);
        joinInternal(room, userId, VideoRoomParticipantRole.PARTICIPANT, VideoRoomParticipantStatus.WAITING);
        VideoRoomParticipant waiting = findParticipant(roomId, userId);
        notifyJoinRequest(room, waiting);
        return toResponse(room, userId, true, true);
    }

    @Transactional
    public VideoRoomResponse joinRoomByCode(String roomCode, UUID userId) {
        VideoRoom room = findRoomByCode(roomCode);
        return joinRoom(room.getId(), userId, true);
    }

    @Transactional
    public VideoRoomResponse approveJoinRequest(UUID roomId, UUID hostId, UUID targetUserId) {
        VideoRoom room = findRoom(roomId);
        ensureLive(room);
        ensureHost(room, hostId);
        VideoRoomParticipant participant = findParticipant(roomId, targetUserId);
        if (!VideoRoomParticipantStatus.WAITING.equals(participant.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending join request for this user");
        }
        long count = countActiveParticipants(roomId);
        entitlementService.validateJoinCapacity(room, count);

        participant.setStatus(VideoRoomParticipantStatus.ACTIVE);
        participantRepository.save(participant);

        String displayName = displayName(userProfileRepository.findById(targetUserId).orElse(null));
        inRoomBroadcastService.signal("JOIN_APPROVED", roomId, hostId, targetUserId, displayName, targetUserId);
        inRoomBroadcastService.signal("USER_JOINED", roomId, targetUserId, null, displayName, targetUserId);
        lobbyBroadcastService.broadcast("ROOM_JOINED", roomId);
        return toResponse(room, hostId, true, true);
    }

    @Transactional
    public VideoRoomResponse rejectJoinRequest(UUID roomId, UUID hostId, UUID targetUserId) {
        VideoRoom room = findRoom(roomId);
        ensureLive(room);
        ensureHost(room, hostId);
        VideoRoomParticipant participant = findParticipant(roomId, targetUserId);
        if (!VideoRoomParticipantStatus.WAITING.equals(participant.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending join request for this user");
        }
        participant.setStatus(VideoRoomParticipantStatus.REMOVED);
        participant.setLeftAt(Instant.now());
        participantRepository.save(participant);

        inRoomBroadcastService.signal(
            "JOIN_REJECTED",
            roomId,
            hostId,
            targetUserId,
            displayName(userProfileRepository.findById(targetUserId).orElse(null)),
            targetUserId
        );
        return toResponse(room, hostId, true, true);
    }

    @Transactional
    public VideoRoomResponse createRoom(
        UUID hostId,
        String username,
        CreateVideoRoomRequest request
    ) {
        ensureProfile(hostId, username);
        entitlementService.validateCanCreateRoom(hostId);

        VideoRoom room = new VideoRoom();
        room.setHostId(hostId);
        room.setTitle(request.title().trim());
        room.setDescription(request.description().trim());
        room.setCategory(normalize(request.category(), "general"));
        room.setRoomType(normalizeRoomType(request.roomType()));
        room.setUseCase(normalizeUseCase(request.useCase()));
        entitlementService.applyRoomLimitsOnCreate(room, hostId);
        if (request.maxParticipants() != null && room.isPremiumRoom()) {
            room.setMaxParticipants(entitlementService.resolveMaxParticipants(request.maxParticipants(), true));
        }
        if (request.tags() != null) {
            room.setTags(normalizeTags(request.tags()));
        }
        if (request.chatEnabled() != null) {
            room.setChatEnabled(request.chatEnabled());
        }
        if (request.screenShareEnabled() != null) {
            room.setScreenShareEnabled(request.screenShareEnabled());
        }
        if (request.breakoutEnabled() != null) {
            room.setBreakoutEnabled(request.breakoutEnabled());
        }
        room.setStatus("live");

        VideoRoom saved = roomRepository.save(room);
        joinInternal(saved, hostId, VideoRoomParticipantRole.HOST, VideoRoomParticipantStatus.ACTIVE);

        VideoRoomMessage welcome = new VideoRoomMessage();
        welcome.setRoomId(saved.getId());
        welcome.setAuthorId(hostId);
        welcome.setContent("Room created. Welcome everyone - introduce yourself and share what you'd like to work on.");
        messageRepository.save(welcome);

        lobbyBroadcastService.broadcast("ROOM_CREATED", saved.getId());
        return toResponse(saved, hostId, true, true);
    }

    @Transactional(readOnly = true)
    public List<VideoRoomResponse> listRooms(
        UUID viewerId,
        String status,
        String category,
        String roomType,
        String query,
        int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        PageRequest page = PageRequest.of(0, safeLimit);
        String normalizedStatus = normalize(status, "live");
        String normalizedType = roomType != null && !roomType.isBlank() ? normalizeRoomType(roomType) : null;

        List<VideoRoom> rooms;
        if (query != null && !query.isBlank()) {
            rooms = roomRepository.searchByStatus(query.trim(), normalizedStatus, page);
        } else if (normalizedType != null) {
            rooms = roomRepository.findAllByStatusAndRoomTypeOrderByCreatedAtDesc(
                normalizedStatus, normalizedType, page
            );
        } else if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            rooms = roomRepository.findAllByCategoryAndStatusOrderByCreatedAtDesc(
                normalize(category, "general"), normalizedStatus, page
            );
        } else {
            rooms = roomRepository.findAllByParentRoomIdIsNullAndStatusOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
                normalizedStatus, page
            );
        }

        return rooms.stream()
            .map(room -> {
                refreshExpiryState(room);
                return room;
            })
            .filter(room -> "live".equals(room.getStatus()) && isLiveNotExpired(room))
            .filter(this::isVisibleToViewer)
            .map(room -> toResponse(room, viewerId, false, true))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<VideoRoomResponse> listLiveRooms(UUID viewerId, String category, String query, int limit) {
        return listRooms(viewerId, "live", category, null, query, limit);
    }

    @Transactional(readOnly = true)
    public List<VideoRoomParticipantResponse> listParticipants(UUID roomId, UUID viewerId) {
        VideoRoom room = findRoom(roomId);
        return participantRepository
            .findActiveByRoomAndStatusOrderByJoinedAt(
                room.getId(),
                VideoRoomParticipantStatus.ACTIVE
            )
            .stream()
            .map(p -> toParticipantResponse(p, room.getHostId()))
            .toList();
    }

    @Transactional
    public VideoRoomResponse getRoom(UUID roomId, UUID viewerId) {
        return toResponse(findRoom(roomId), viewerId, true, true);
    }

    @Transactional
    public VideoRoomResponse leaveRoom(UUID roomId, UUID userId) {
        VideoRoom room = findRoom(roomId);
        if (!participantRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)) {
            return toResponse(room, userId, true, true);
        }

        VideoRoomParticipant participant = findParticipant(roomId, userId);
        if (VideoRoomParticipantStatus.WAITING.equals(participant.getStatus())) {
            participant.setLeftAt(Instant.now());
            participant.setStatus(VideoRoomParticipantStatus.REMOVED);
            participantRepository.save(participant);
            return toResponse(room, userId, true, true);
        }

        markParticipantLeft(roomId, userId);
        lobbyBroadcastService.broadcast("ROOM_LEFT", roomId);
        inRoomBroadcastService.signal(
            "USER_LEFT",
            roomId,
            userId,
            null,
            displayName(userProfileRepository.findById(userId).orElse(null)),
            userId
        );

        return toResponse(room, userId, true, true);
    }

    @Transactional
    public VideoRoomResponse endRoom(UUID roomId, UUID userId, String roles) {
        VideoRoom room = findRoom(roomId);
        ensureHost(room, userId);
        endRoomInternal(room);
        endChildBreakouts(room.getId());
        lobbyBroadcastService.broadcast("ROOM_ENDED", roomId);
        inRoomBroadcastService.signal("ROOM_ENDED", roomId, userId, null, null, null);
        return toResponse(room, userId, true, true);
    }

    @Transactional
    public VideoRoomResponse updatePermissions(
        UUID roomId,
        UUID userId,
        String roles,
        UpdateVideoRoomPermissionsRequest request
    ) {
        VideoRoom room = findRoom(roomId);
        if (!canManageRoom(room, userId, roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host or admin can update permissions");
        }
        if (request.chatEnabled() != null) {
            room.setChatEnabled(request.chatEnabled());
        }
        if (request.screenShareEnabled() != null) {
            room.setScreenShareEnabled(request.screenShareEnabled());
        }
        if (request.breakoutEnabled() != null) {
            room.setBreakoutEnabled(request.breakoutEnabled());
        }
        return toResponse(roomRepository.save(room), userId, true, true);
    }

    @Transactional
    public VideoRoomResponse setParticipantMuted(
        UUID roomId,
        UUID actorId,
        String roles,
        UUID targetUserId,
        SetParticipantMutedRequest request
    ) {
        VideoRoom room = findRoom(roomId);
        ensureLive(room);
        ensureHost(room, actorId);
        VideoRoomParticipant participant = findParticipant(roomId, targetUserId);
        if (!VideoRoomParticipantStatus.ACTIVE.equals(participant.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant is not active in the room");
        }
        participant.setMuted(request.muted());
        if (!request.muted()) {
            participant.setCanSpeak(true);
        }
        participantRepository.save(participant);
        if (request.muted() && !actorId.equals(targetUserId)) {
            inRoomBroadcastService.signal("MUTE_USER", roomId, actorId, targetUserId, null, targetUserId);
        }
        return toResponse(room, actorId, true, true);
    }

    @Transactional
    public VideoRoomResponse setParticipantCamera(
        UUID roomId,
        UUID actorId,
        String roles,
        UUID targetUserId,
        SetParticipantCameraRequest request
    ) {
        VideoRoom room = findRoom(roomId);
        ensureLive(room);
        ensureHost(room, actorId);
        VideoRoomParticipant participant = findParticipant(roomId, targetUserId);
        if (!VideoRoomParticipantStatus.ACTIVE.equals(participant.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant is not active in the room");
        }
        participant.setCameraEnabled(request.enabled());
        participantRepository.save(participant);
        if (!request.enabled()) {
            inRoomBroadcastService.signal("CAMERA_OFF", roomId, actorId, targetUserId, null, targetUserId);
        }
        return toResponse(room, actorId, true, true);
    }

    @Transactional
    public VideoRoomResponse removeParticipant(
        UUID roomId,
        UUID actorId,
        String roles,
        UUID targetUserId
    ) {
        VideoRoom room = findRoom(roomId);
        ensureHost(room, actorId);
        VideoRoomParticipant participant = findParticipant(roomId, targetUserId);
        if (VideoRoomParticipantRole.HOST.equals(participant.getParticipantRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the host");
        }
        if (!VideoRoomParticipantStatus.ACTIVE.equals(participant.getStatus())) {
            return toResponse(room, actorId, true, true);
        }
        participant.setStatus(VideoRoomParticipantStatus.REMOVED);
        participant.setLeftAt(Instant.now());
        participantRepository.save(participant);
        inRoomBroadcastService.signal("REMOVE_USER", roomId, actorId, targetUserId, null, targetUserId);
        inRoomBroadcastService.signal("USER_LEFT", roomId, targetUserId, null, null, targetUserId);
        lobbyBroadcastService.broadcast("ROOM_LEFT", roomId);
        return toResponse(room, actorId, true, true);
    }

    @Transactional
    public VideoRoomResponse createBreakout(
        UUID parentRoomId,
        UUID hostId,
        String roles,
        CreateBreakoutRoomRequest request
    ) {
        VideoRoom parent = findRoom(parentRoomId);
        ensureLive(parent);
        if (!parent.isBreakoutEnabled() && !canManageRoom(parent, hostId, roles)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Breakout rooms are disabled for this session");
        }
        if (!canManageRoom(parent, hostId, roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host or admin can create breakouts");
        }

        VideoRoom breakout = new VideoRoom();
        breakout.setHostId(hostId);
        breakout.setParentRoomId(parent.getId());
        breakout.setTitle(request.title().trim());
        breakout.setDescription("Breakout from " + parent.getTitle());
        breakout.setCategory(parent.getCategory());
        breakout.setRoomType(parent.getRoomType());
        breakout.setUseCase(parent.getUseCase());
        breakout.setMaxParticipants(request.maxParticipants() != null ? request.maxParticipants() : 6);
        breakout.setChatEnabled(parent.isChatEnabled());
        breakout.setScreenShareEnabled(parent.isScreenShareEnabled());
        breakout.setBreakoutEnabled(false);
        breakout.setStatus("live");
        breakout.setTags(Set.copyOf(parent.getTags()));

        VideoRoom saved = roomRepository.save(breakout);
        joinInternal(saved, hostId, VideoRoomParticipantRole.HOST, VideoRoomParticipantStatus.ACTIVE);
        return toResponse(parent, hostId, true, true);
    }

    @Transactional(readOnly = true)
    public List<VideoRoomMessageResponse> listMessages(UUID roomId, UUID viewerId, int limit) {
        VideoRoom room = findRoom(roomId);
        if (!participantRepository.existsActiveByRoomUserAndStatus(
            roomId, viewerId, VideoRoomParticipantStatus.ACTIVE
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join the room to view messages");
        }
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return messageRepository
            .findAllByRoomIdOrderByCreatedAtAsc(room.getId(), PageRequest.of(0, safeLimit))
            .stream()
            .map(this::toMessageResponse)
            .toList();
    }

    @Transactional
    public VideoRoomMessageResponse sendMessage(UUID roomId, UUID userId, SendVideoRoomMessageRequest request) {
        VideoRoom room = findRoom(roomId);
        ensureLive(room);
        if (!room.isChatEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chat is disabled in this room");
        }
        if (!participantRepository.existsActiveByRoomUserAndStatus(
            roomId, userId, VideoRoomParticipantStatus.ACTIVE
        )) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join the room to send messages");
        }
        VideoRoomParticipant participant = findParticipant(roomId, userId);
        if (participant.isMuted() || !participant.isCanSpeak()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are muted in this room");
        }

        VideoRoomMessage message = new VideoRoomMessage();
        message.setRoomId(room.getId());
        message.setAuthorId(userId);
        message.setContent(request.content().trim());
        return toMessageResponse(messageRepository.save(message));
    }

    @Transactional
    public void expireRoom(UUID roomId) {
        VideoRoom room = findRoom(roomId);
        if (!"live".equals(room.getStatus())) {
            return;
        }
        expireRoomInternal(room);
        notificationService.notifyRoomExpired(room.getHostId(), room.getTitle());
        lobbyBroadcastService.broadcast("ROOM_ENDED", roomId);
    }

    private void joinInternal(VideoRoom room, UUID userId, String role, String status) {
        ParticipantId id = new ParticipantId(room.getId(), userId);
        Optional<VideoRoomParticipant> existing = participantRepository.findById(id);
        if (existing.isPresent()) {
            VideoRoomParticipant participant = existing.get();
            if (participant.getLeftAt() == null
                && VideoRoomParticipantStatus.ACTIVE.equals(participant.getStatus())) {
                return;
            }
            participant.setLeftAt(null);
            participant.setJoinedAt(Instant.now());
            participant.setParticipantRole(role);
            participant.setStatus(status);
            participant.setMuted(false);
            participant.setCameraEnabled(true);
            participant.setCanSpeak(true);
            participantRepository.save(participant);
            userStreakService.recordActivity(userId);
            return;
        }
        VideoRoomParticipant participant = new VideoRoomParticipant();
        participant.setRoomId(room.getId());
        participant.setUserId(userId);
        participant.setParticipantRole(role);
        participant.setStatus(status);
        participantRepository.save(participant);
        userStreakService.recordActivity(userId);
    }

    private String participantRoleForJoin(VideoRoom room, UUID userId) {
        if (room.getHostId().equals(userId)) {
            return VideoRoomParticipantRole.HOST;
        }
        return VideoRoomParticipantRole.PARTICIPANT;
    }

    private void notifyJoinRequest(VideoRoom room, VideoRoomParticipant participant) {
        UserProfile profile = userProfileRepository.findById(participant.getUserId()).orElse(null);
        String name = displayName(profile);
        inRoomBroadcastService.signal(
            "JOIN_REQUEST",
            room.getId(),
            participant.getUserId(),
            room.getHostId(),
            name,
            participant.getUserId()
        );
    }

    private void ensureHost(VideoRoom room, UUID userId) {
        if (!room.getHostId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can perform this action");
        }
    }

    private long countActiveParticipants(UUID roomId) {
        return participantRepository.countActiveByRoomAndStatus(
            roomId,
            VideoRoomParticipantStatus.ACTIVE
        );
    }

    private void endRoomInternal(VideoRoom room) {
        room.setStatus("ended");
        room.setEndedAt(Instant.now());
        roomRepository.save(room);
        clearParticipants(room.getId());
    }

    private void expireRoomInternal(VideoRoom room) {
        room.setStatus("expired");
        room.setEndedAt(Instant.now());
        roomRepository.save(room);
        clearParticipants(room.getId());
    }

    private void clearParticipants(UUID roomId) {
        for (VideoRoomParticipant participant : participantRepository.findAllByRoomIdOrderByJoinedAtAsc(roomId)) {
            if (participant.getLeftAt() == null) {
                participant.setLeftAt(Instant.now());
                participantRepository.save(participant);
            }
        }
    }

    private void markParticipantLeft(UUID roomId, UUID userId) {
        participantRepository.findById(new ParticipantId(roomId, userId)).ifPresent(participant -> {
            participant.setLeftAt(Instant.now());
            if (!VideoRoomParticipantRole.HOST.equals(participant.getParticipantRole())) {
                participant.setStatus(VideoRoomParticipantStatus.REMOVED);
            }
            participantRepository.save(participant);
        });
    }

    private void endChildBreakouts(UUID parentId) {
        for (VideoRoom child : roomRepository.findAllByParentRoomIdAndStatusOrderByCreatedAtAsc(parentId, "live")) {
            endRoomInternal(child);
        }
    }

    private VideoRoom findRoom(UUID roomId) {
        VideoRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        refreshExpiryState(room);
        return room;
    }

    private VideoRoom findRoomByCode(String roomCode) {
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room code is required");
        }
        VideoRoom room = roomRepository.findByRoomCode(roomCode.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        refreshExpiryState(room);
        return room;
    }

    private void refreshExpiryState(VideoRoom room) {
        if (!"live".equals(room.getStatus())) {
            return;
        }
        if (room.isPremiumRoom() || room.getExpiresAt() == null) {
            maybeSendExpiryWarning(room);
            return;
        }
        if (Instant.now().isAfter(room.getExpiresAt())) {
            expireRoomInternal(room);
            notificationService.notifyRoomExpired(room.getHostId(), room.getTitle());
            return;
        }
        maybeSendExpiryWarning(room);
    }

    private void maybeSendExpiryWarning(VideoRoom room) {
        if (room.isPremiumRoom() || room.getExpiresAt() == null || room.isExpiryWarningSent()) {
            return;
        }
        Long remaining = entitlementService.remainingSeconds(room);
        if (remaining != null && remaining <= 300 && remaining > 0) {
            room.setExpiryWarningSent(true);
            roomRepository.save(room);
            notificationService.notifyExpiryWarning(room.getHostId(), room.getTitle());
        }
    }

    private VideoRoomParticipant findParticipant(UUID roomId, UUID userId) {
        return participantRepository
            .findById(new ParticipantId(roomId, userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
    }

    private void ensureLive(VideoRoom room) {
        if ("ended".equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room has ended");
        }
        if ("expired".equals(room.getStatus())) {
            throw new ResponseStatusException(
                HttpStatus.GONE,
                "Your free meeting has ended. Upgrade for INR 50 to continue unlimited meetings."
            );
        }
    }

    private boolean canManageRoom(VideoRoom room, UUID userId, String roles) {
        return room.getHostId().equals(userId)
            || (room.getModeratorId() != null && room.getModeratorId().equals(userId))
            || isAdmin(roles);
    }

    private boolean isAdmin(String roles) {
        if (roles == null || roles.isBlank()) {
            return false;
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        return upper.contains("ADMIN") || upper.contains("MODERATOR");
    }

    private boolean isVisibleToViewer(VideoRoom room) {
        String visibility = room.getVisibility();
        return visibility == null || "public".equalsIgnoreCase(visibility);
    }

    private boolean isLiveNotExpired(VideoRoom room) {
        if (!"live".equals(room.getStatus())) {
            return false;
        }
        if (room.isPremiumRoom() || room.getExpiresAt() == null) {
            return true;
        }
        return Instant.now().isBefore(room.getExpiresAt());
    }

    private void ensureProfile(UUID userId, String username) {
        userProfileRepository.findById(userId).orElseGet(() -> {
            UserProfile created = new UserProfile();
            created.setId(userId);
            created.setUsername(username);
            return userProfileRepository.save(created);
        });
    }

    private VideoRoomResponse toResponse(
        VideoRoom room,
        UUID viewerId,
        boolean includeParticipants,
        boolean includeBreakouts
    ) {
        UserProfile host = userProfileRepository.findById(room.getHostId()).orElse(null);
        UserProfile moderator = room.getModeratorId() != null
            ? userProfileRepository.findById(room.getModeratorId()).orElse(null)
            : null;
        String hostName = displayName(host);
        long participantCount = countActiveParticipants(room.getId());
        boolean joined = participantRepository.existsActiveByRoomUserAndStatus(
            room.getId(),
            viewerId,
            VideoRoomParticipantStatus.ACTIVE
        );
        boolean full = participantCount >= room.getMaxParticipants();
        String viewerJoinStatus = resolveViewerJoinStatus(room.getId(), viewerId);

        List<VideoRoomParticipantResponse> participants;
        List<VideoRoomParticipantResponse> waitingParticipants;
        if (includeParticipants) {
            participants = participantRepository
                .findActiveByRoomAndStatusOrderByJoinedAt(
                    room.getId(),
                    VideoRoomParticipantStatus.ACTIVE
                )
                .stream()
                .map(p -> toParticipantResponse(p, room.getHostId()))
                .toList();
            if (room.getHostId().equals(viewerId)) {
                waitingParticipants = participantRepository
                    .findActiveByRoomAndStatusOrderByJoinedAt(
                        room.getId(),
                        VideoRoomParticipantStatus.WAITING
                    )
                    .stream()
                    .map(p -> toParticipantResponse(p, room.getHostId()))
                    .toList();
            } else {
                waitingParticipants = List.of();
            }
        } else {
            participants = List.of();
            waitingParticipants = List.of();
        }

        List<VideoRoomResponse> breakouts;
        if (includeBreakouts && room.getParentRoomId() == null) {
            breakouts = roomRepository.findAllByParentRoomIdAndStatusOrderByCreatedAtAsc(room.getId(), "live").stream()
                .map(b -> toResponse(b, viewerId, true, false))
                .toList();
        } else {
            breakouts = List.of();
        }

        boolean viewerPremium = entitlementService.isPremium(viewerId);
        Long remainingSeconds = entitlementService.remainingSeconds(room);
        boolean expiredDueToTime = "expired".equals(room.getStatus());
        String roomCode = room.getRoomCode();
        String joinPath = roomCode != null ? entitlementService.buildJoinPath(roomCode) : null;
        String joinUrl = roomCode != null ? entitlementService.buildJoinUrl(roomCode) : null;

        return new VideoRoomResponse(
            room.getId(),
            room.getHostId(),
            hostName,
            host != null ? host.getRole() : null,
            room.getTitle(),
            room.getDescription(),
            room.getCategory(),
            room.getRoomType(),
            room.getUseCase(),
            room.getParentRoomId(),
            room.getStatus(),
            room.getMaxParticipants(),
            participantCount,
            joined,
            full,
            room.isChatEnabled(),
            room.isScreenShareEnabled(),
            room.isBreakoutEnabled(),
            room.isFeatured(),
            room.getFeaturedOrder(),
            room.getVisibility() != null ? room.getVisibility() : "public",
            room.getModeratorId(),
            moderator != null ? displayName(moderator) : null,
            Set.copyOf(room.getTags()),
            participants,
            breakouts,
            room.getCreatedAt(),
            room.getEndedAt(),
            roomCode,
            joinUrl,
            joinPath,
            room.getExpiresAt(),
            room.isPremiumRoom(),
            remainingSeconds,
            viewerPremium,
            !room.isPremiumRoom(),
            entitlementService.nextFreeRoomAvailableAt(viewerId).orElse(null),
            expiredDueToTime,
            viewerJoinStatus,
            waitingParticipants
        );
    }

    private String resolveViewerJoinStatus(UUID roomId, UUID viewerId) {
        return participantRepository.findById(new ParticipantId(roomId, viewerId))
            .filter(p -> p.getLeftAt() == null)
            .map(VideoRoomParticipant::getStatus)
            .orElse(null);
    }

    private VideoRoomParticipantResponse toParticipantResponse(VideoRoomParticipant participant, UUID hostId) {
        UserProfile profile = userProfileRepository.findById(participant.getUserId()).orElse(null);
        boolean isHost = VideoRoomParticipantRole.HOST.equals(participant.getParticipantRole())
            || hostId.equals(participant.getUserId());
        return new VideoRoomParticipantResponse(
            participant.getUserId(),
            displayName(profile),
            profile != null ? profile.getRole() : null,
            isHost,
            participant.getParticipantRole(),
            participant.getStatus(),
            participant.isMuted(),
            participant.isCameraEnabled(),
            participant.isCanSpeak(),
            participant.isHandRaised(),
            participant.getJoinedAt()
        );
    }

    private VideoRoomMessageResponse toMessageResponse(VideoRoomMessage message) {
        UserProfile author = userProfileRepository.findById(message.getAuthorId()).orElse(null);
        return new VideoRoomMessageResponse(
            message.getId(),
            message.getRoomId(),
            message.getAuthorId(),
            displayName(author),
            message.getContent(),
            message.getCreatedAt()
        );
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

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeRoomType(String value) {
        String normalized = normalize(value, "public");
        if (!ROOM_TYPES.contains(normalized)) {
            return "public";
        }
        return normalized;
    }

    private String normalizeUseCase(String value) {
        String normalized = normalize(value, "community");
        if (!USE_CASES.contains(normalized)) {
            return "community";
        }
        return normalized;
    }

    private Set<String> normalizeTags(Set<String> tags) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String tag : tags) {
            String trimmed = tag.trim().toLowerCase(Locale.ROOT);
            if (!trimmed.isEmpty()) {
                normalized.add(trimmed);
            }
        }
        return normalized;
    }
}
