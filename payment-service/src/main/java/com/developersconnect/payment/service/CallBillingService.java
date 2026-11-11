package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.CallSessionResponse;
import com.developersconnect.payment.dto.MarketplaceConfigResponse;
import com.developersconnect.payment.dto.StartCallRequest;
import com.developersconnect.payment.dto.UpdateMarketplaceConfigRequest;
import com.developersconnect.payment.model.CallSession;
import com.developersconnect.payment.model.MarketplaceConfig;
import com.developersconnect.payment.repository.CallSessionRepository;
import com.developersconnect.payment.repository.MarketplaceConfigRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CallBillingService {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_ENDED = "ENDED";
    public static final String STATUS_INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE";

    private final CallSessionRepository callSessionRepository;
    private final WalletService walletService;
    private final MarketplaceConfigRepository configRepository;

    public CallBillingService(
        CallSessionRepository callSessionRepository,
        WalletService walletService,
        MarketplaceConfigRepository configRepository
    ) {
        this.callSessionRepository = callSessionRepository;
        this.walletService = walletService;
        this.configRepository = configRepository;
    }

    @Transactional
    public CallSessionResponse startCall(UUID userId, StartCallRequest request) {
        if (callSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .anyMatch(s -> STATUS_ACTIVE.equals(s.getStatus()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active call");
        }

        long pricePerMinute = request.pricePerMinuteCents();
        if (walletService.balanceCents(userId) < pricePerMinute) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Insufficient wallet balance");
        }

        CallSession session = new CallSession();
        session.setUserId(userId);
        session.setMentorId(request.mentorId());
        session.setCallType(normalizeCallType(request.callType()));
        session.setStartTime(Instant.now());
        session.setPricePerMinuteCents(pricePerMinute);
        session.setStatus(STATUS_ACTIVE);
        session.setLastBilledAt(Instant.now());
        CallSession saved = callSessionRepository.save(session);
        return toResponse(saved, userId);
    }

    @Transactional
    public CallSessionResponse endCall(UUID userId, UUID callId) {
        CallSession session = requireActiveUserCall(userId, callId);
        finalizeSession(session, STATUS_ENDED);
        return toResponse(session, userId);
    }

    @Transactional
    public CallSessionResponse deductMinute(UUID userId, UUID callId) {
        CallSession session = requireActiveUserCall(userId, callId);
        billNextMinute(session);
        return toResponse(session, userId);
    }

    @Transactional(readOnly = true)
    public CallSessionResponse getCall(UUID userId, UUID callId) {
        CallSession session = callSessionRepository.findByIdAndUserId(callId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Call not found"));
        return toResponse(session, userId);
    }

    @Transactional(readOnly = true)
    public List<CallSessionResponse> history(UUID userId) {
        return callSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(s -> toResponse(s, userId))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CallSessionResponse> mentorHistory(UUID mentorId) {
        return callSessionRepository.findByMentorIdOrderByCreatedAtDesc(mentorId).stream()
            .map(s -> toResponse(s, s.getUserId()))
            .toList();
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void billActiveCalls() {
        for (CallSession session : callSessionRepository.findByStatus(STATUS_ACTIVE)) {
            try {
                billNextMinute(session);
            } catch (ResponseStatusException ex) {
                if (ex.getStatusCode() == HttpStatus.PAYMENT_REQUIRED) {
                    finalizeSession(session, STATUS_INSUFFICIENT_BALANCE);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public MarketplaceConfigResponse getConfig() {
        return toConfigResponse(requireConfig());
    }

    @Transactional
    public MarketplaceConfigResponse updateConfig(UpdateMarketplaceConfigRequest request) {
        MarketplaceConfig config = requireConfig();
        if (request.minPricePerMinuteCents() != null) {
            config.setMinPricePerMinuteCents(request.minPricePerMinuteCents());
        }
        if (request.maxPricePerMinuteCents() != null) {
            config.setMaxPricePerMinuteCents(request.maxPricePerMinuteCents());
        }
        if (request.platformSharePercent() != null) {
            config.setPlatformSharePercent(request.platformSharePercent());
        }
        return toConfigResponse(configRepository.save(config));
    }

    private void billNextMinute(CallSession session) {
        if (!STATUS_ACTIVE.equals(session.getStatus())) {
            return;
        }
        Instant now = Instant.now();
        Instant last = session.getLastBilledAt() != null ? session.getLastBilledAt() : session.getStartTime();
        if (Duration.between(last, now).toSeconds() < 55) {
            return;
        }

        long charge = session.getPricePerMinuteCents();
        walletService.debit(
            session.getUserId(),
            charge,
            "CALL_BILLING",
            "Per-minute call charge",
            session.getId()
        );

        double share = requireConfig().getPlatformSharePercent() / 100.0;
        long platformShare = Math.round(charge * share);
        long mentorShare = charge - platformShare;

        session.setMinutesBilled(session.getMinutesBilled() + 1);
        session.setAmountDeductedCents(session.getAmountDeductedCents() + charge);
        session.setPlatformCommissionCents(session.getPlatformCommissionCents() + platformShare);
        session.setMentorEarningCents(session.getMentorEarningCents() + mentorShare);
        session.setLastBilledAt(now);
        session.setDurationSeconds(Duration.between(session.getStartTime(), now).getSeconds());
        callSessionRepository.save(session);
    }

    private void finalizeSession(CallSession session, String status) {
        session.setStatus(status);
        session.setEndTime(Instant.now());
        session.setDurationSeconds(Duration.between(session.getStartTime(), session.getEndTime()).getSeconds());
        callSessionRepository.save(session);
    }

    private CallSession requireActiveUserCall(UUID userId, UUID callId) {
        CallSession session = callSessionRepository.findByIdAndUserId(callId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Call not found"));
        if (!STATUS_ACTIVE.equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Call is not active");
        }
        return session;
    }

    private MarketplaceConfig requireConfig() {
        return configRepository.findById("default").orElseGet(() -> {
            MarketplaceConfig config = new MarketplaceConfig();
            config.setMinPricePerMinuteCents(500);
            config.setMaxPricePerMinuteCents(50_000);
            config.setPlatformSharePercent(50.0);
            return configRepository.save(config);
        });
    }

    private String normalizeCallType(String callType) {
        return switch (callType.trim().toUpperCase()) {
            case "AUDIO" -> "AUDIO";
            case "VIDEO" -> "VIDEO";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid call type");
        };
    }

    private CallSessionResponse toResponse(CallSession session, UUID userId) {
        long balance = walletService.balanceCents(userId);
        long price = session.getPricePerMinuteCents();
        boolean lowBalance = STATUS_ACTIVE.equals(session.getStatus()) && balance < price;
        Integer countdown = lowBalance ? 30 : null;
        return new CallSessionResponse(
            session.getId(),
            session.getUserId(),
            session.getMentorId(),
            session.getCallType(),
            session.getStartTime(),
            session.getEndTime(),
            session.getDurationSeconds(),
            session.getAmountDeductedCents(),
            session.getMentorEarningCents(),
            session.getPlatformCommissionCents(),
            session.getPricePerMinuteCents(),
            session.getMinutesBilled(),
            session.getStatus(),
            balance,
            lowBalance,
            countdown
        );
    }

    private MarketplaceConfigResponse toConfigResponse(MarketplaceConfig config) {
        return new MarketplaceConfigResponse(
            config.getMinPricePerMinuteCents(),
            config.getMaxPricePerMinuteCents(),
            config.getPlatformSharePercent()
        );
    }
}
