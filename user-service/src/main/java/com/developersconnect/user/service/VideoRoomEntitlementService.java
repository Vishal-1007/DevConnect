package com.developersconnect.user.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.config.VideoRoomProperties;
import com.developersconnect.user.model.UserVideoRoomSubscription;
import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.repository.UserVideoRoomSubscriptionRepository;
import com.developersconnect.user.repository.VideoRoomRepository;

@Service
public class VideoRoomEntitlementService {

    private static final String CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final VideoRoomProperties properties;
    private final UserVideoRoomSubscriptionRepository subscriptionRepository;
    private final VideoRoomRepository roomRepository;

    public VideoRoomEntitlementService(
        VideoRoomProperties properties,
        UserVideoRoomSubscriptionRepository subscriptionRepository,
        VideoRoomRepository roomRepository
    ) {
        this.properties = properties;
        this.subscriptionRepository = subscriptionRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public boolean isPremium(UUID userId) {
        return subscriptionRepository.findByUserId(userId)
            .map(UserVideoRoomSubscription::isVideoRoomPremium)
            .orElse(false);
    }

    @Transactional
    public UserVideoRoomSubscription getOrCreateSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId).orElseGet(() -> {
            UserVideoRoomSubscription sub = new UserVideoRoomSubscription();
            sub.setUserId(userId);
            sub.setVideoRoomPremium(false);
            return subscriptionRepository.save(sub);
        });
    }

    @Transactional
    public void activatePremium(UUID userId, UUID paymentId) {
        UserVideoRoomSubscription sub = getOrCreateSubscription(userId);
        sub.setVideoRoomPremium(true);
        sub.setPaymentId(paymentId);
        sub.setAmountCents(properties.premiumPriceCents());
        sub.setPurchaseDate(Instant.now());
        subscriptionRepository.save(sub);
    }

    public void validateCanCreateRoom(UUID hostId) {
        if (isPremium(hostId)) {
            return;
        }
        Instant since = Instant.now().minus(Duration.ofHours(properties.freeRoomCooldownHours()));
        if (roomRepository.existsFreeHostRoomSince(hostId, since)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "You have already used your free meeting today. Upgrade for ₹50."
            );
        }
    }

    public void applyRoomLimitsOnCreate(VideoRoom room, UUID hostId) {
        boolean premiumHost = isPremium(hostId);
        room.setRoomCode(generateUniqueRoomCode());
        room.setPremiumRoom(premiumHost);

        if (premiumHost) {
            room.setMaxParticipants(resolveMaxParticipants(null, true));
            room.setExpiresAt(null);
            return;
        }

        room.setMaxParticipants(properties.freeMaxParticipants());
        room.setExpiresAt(Instant.now().plus(Duration.ofMinutes(properties.freeDurationMinutes())));
    }

    public int resolveMaxParticipants(Integer requested, boolean premiumRoom) {
        if (premiumRoom) {
            if (requested == null || requested < 2) {
                return 50;
            }
            return Math.min(requested, 100);
        }
        return properties.freeMaxParticipants();
    }

    public void validateJoinCapacity(VideoRoom room, long currentCount) {
        if (currentCount < room.getMaxParticipants()) {
            return;
        }
        if (room.isPremiumRoom()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is full");
        }
        throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Room limit reached. Ask host to upgrade."
        );
    }

    public Optional<Instant> nextFreeRoomAvailableAt(UUID userId) {
        if (isPremium(userId)) {
            return Optional.empty();
        }
        Instant since = Instant.now().minus(Duration.ofHours(properties.freeRoomCooldownHours()));
        Duration cooldown = Duration.ofHours(properties.freeRoomCooldownHours());
        return roomRepository
            .findFirstByHostIdAndParentRoomIdIsNullAndPremiumRoomFalseAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
                userId,
                since
            )
            .map(room -> room.getCreatedAt().plus(cooldown));
    }

    public Long remainingSeconds(VideoRoom room) {
        if (room.isPremiumRoom() || room.getExpiresAt() == null) {
            return null;
        }
        long seconds = Duration.between(Instant.now(), room.getExpiresAt()).getSeconds();
        return Math.max(0L, seconds);
    }

    public String buildJoinUrl(String roomCode) {
        String base = properties.frontendBaseUrl().replaceAll("/$", "");
        String path = properties.joinPathPrefix();
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        if (!path.endsWith("/")) {
            path = path + "/";
        }
        return base + path + roomCode;
    }

    public String buildJoinPath(String roomCode) {
        String path = properties.joinPathPrefix();
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        if (!path.endsWith("/")) {
            path = path + "/";
        }
        return path + roomCode;
    }

    private String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = randomCode(12);
            if (roomRepository.findByRoomCode(code).isEmpty()) {
                return code;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate room code");
    }

    private static String randomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }
}
