package com.developersconnect.user.service;

import com.developersconnect.user.config.VideoRoomProperties;
import com.developersconnect.user.dto.ConfirmVideoRoomPaymentRequest;
import com.developersconnect.user.dto.VideoRoomOrderResponse;
import com.developersconnect.user.dto.VideoRoomUsageResponse;
import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.model.VideoRoomPaymentTransaction;
import com.developersconnect.user.repository.VideoRoomPaymentTransactionRepository;
import com.developersconnect.user.repository.VideoRoomRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VideoRoomPaymentService {

    private final VideoRoomProperties properties;
    private final VideoRoomEntitlementService entitlementService;
    private final PaymentVerificationService paymentVerificationService;
    private final VideoRoomPaymentTransactionRepository transactionRepository;
    private final VideoRoomNotificationService notificationService;
    private final VideoRoomRepository roomRepository;

    public VideoRoomPaymentService(
        VideoRoomProperties properties,
        VideoRoomEntitlementService entitlementService,
        PaymentVerificationService paymentVerificationService,
        VideoRoomPaymentTransactionRepository transactionRepository,
        VideoRoomNotificationService notificationService,
        VideoRoomRepository roomRepository
    ) {
        this.properties = properties;
        this.entitlementService = entitlementService;
        this.paymentVerificationService = paymentVerificationService;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
        this.roomRepository = roomRepository;
    }

    public VideoRoomOrderResponse createOrder(UUID userId) {
        if (entitlementService.isPremium(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Video Room Pro is already active");
        }
        String idempotencyKey = "video-room-pro-" + userId + "-" + UUID.randomUUID();
        return new VideoRoomOrderResponse(
            properties.premiumPriceInr(),
            "INR",
            "DevConnect — Video Room Pro (Lifetime)",
            idempotencyKey,
            properties.premiumPriceCents()
        );
    }

    @Transactional
    public VideoRoomUsageResponse confirmPayment(UUID userId, ConfirmVideoRoomPaymentRequest request) {
        UUID paymentId = request.paymentId();
        if (paymentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paymentId is required");
        }
        if (transactionRepository.existsByPaymentId(paymentId)) {
            return buildUsageResponse(userId);
        }

        paymentVerificationService.verifyCompletedPurchase(
            userId,
            paymentId,
            properties.premiumPriceCents(),
            "INR"
        );

        entitlementService.activatePremium(userId, paymentId);

        VideoRoomPaymentTransaction tx = new VideoRoomPaymentTransaction();
        tx.setUserId(userId);
        tx.setPaymentId(paymentId);
        tx.setAmountCents(properties.premiumPriceCents());
        tx.setFeatureType("VIDEO_ROOM_PRO");
        tx.setStatus("completed");
        transactionRepository.save(tx);

        notificationService.notifyPremiumActivated(userId);
        return buildUsageResponse(userId);
    }

    private VideoRoomUsageResponse buildUsageResponse(UUID userId) {
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
            properties.freeMaxParticipants(),
            properties.freeDurationMinutes(),
            properties.premiumPriceInr(),
            canCreate,
            nextFree.orElse(null),
            activeFreeRoomId,
            remaining
        );
    }
}
