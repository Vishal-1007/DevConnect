package com.developersconnect.user.service;

import com.developersconnect.user.dto.BanAnalyticsResponse;
import com.developersconnect.user.dto.CreateUserBanRequest;
import com.developersconnect.user.dto.RestoreUserBanRequest;
import com.developersconnect.user.dto.UserBanResponse;
import com.developersconnect.user.model.PlatformUserBan;
import com.developersconnect.user.repository.PlatformUserBanRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminBanService {

    private static final Set<String> BAN_TYPES = Set.of("permanent", "temporary");

    private final PlatformUserBanRepository banRepository;

    public AdminBanService(PlatformUserBanRepository banRepository) {
        this.banRepository = banRepository;
    }

    @Transactional(readOnly = true)
    public List<UserBanResponse> listBans(String status) {
        List<PlatformUserBan> bans = "all".equalsIgnoreCase(normalizeStatus(status))
            ? banRepository.findAllByOrderByBannedAtDesc()
            : banRepository.findAllByActiveTrueOrderByBannedAtDesc();
        return bans.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BanAnalyticsResponse getAnalytics() {
        List<PlatformUserBan> all = banRepository.findAll();
        long activeRepeat = banRepository.findAllByActiveTrueOrderByBannedAtDesc().stream()
            .map(PlatformUserBan::getAccountId)
            .filter(id -> banRepository.countByAccountId(id) >= 2)
            .distinct()
            .count();

        return new BanAnalyticsResponse(
            banRepository.countByActiveTrue(),
            banRepository.countByBanTypeAndActiveTrue("permanent"),
            banRepository.countByBanTypeAndActiveTrue("temporary"),
            activeRepeat,
            all.size()
        );
    }

    @Transactional
    public UserBanResponse createBan(UUID adminId, String adminUsername, CreateUserBanRequest request) {
        String banType = normalizeBanType(request.banType());
        if (banRepository.countByAccountIdAndActiveTrue(request.accountId()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User already has an active ban");
        }

        PlatformUserBan ban = new PlatformUserBan();
        ban.setAccountId(request.accountId());
        ban.setUsername(request.username().trim());
        ban.setBanType(banType);
        ban.setReason(request.reason().trim());
        ban.setBannedById(adminId);
        ban.setBannedByUsername(adminUsername);
        ban.setSourceReportId(request.sourceReportId());
        ban.setBannedAt(Instant.now());
        if ("temporary".equals(banType)) {
            int days = request.durationDays() != null ? request.durationDays() : 7;
            ban.setExpiresAt(Instant.now().plus(days, ChronoUnit.DAYS));
        }
        ban.setActive(true);
        return toResponse(banRepository.save(ban));
    }

    @Transactional
    public UserBanResponse createBanFromReport(
        UUID accountId,
        String username,
        String banType,
        String reason,
        UUID sourceReportId,
        UUID adminId,
        String adminUsername,
        Integer durationDays
    ) {
        return createBan(
            adminId,
            adminUsername,
            new CreateUserBanRequest(accountId, username, banType, reason, durationDays, sourceReportId)
        );
    }

    @Transactional
    public UserBanResponse restoreBan(UUID banId, RestoreUserBanRequest request) {
        PlatformUserBan ban = findBan(banId);
        if (!ban.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ban is already restored");
        }
        ban.setActive(false);
        ban.setRestoredAt(Instant.now());
        ban.setRestoreNote(request != null && request.note() != null ? request.note().trim() : null);
        return toResponse(banRepository.save(ban));
    }

    private PlatformUserBan findBan(UUID banId) {
        return banRepository.findById(banId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ban record not found"));
    }

    private UserBanResponse toResponse(PlatformUserBan ban) {
        long offenseCount = banRepository.countByAccountId(ban.getAccountId());
        boolean repeatedOffender = offenseCount >= 2;
        return new UserBanResponse(
            ban.getId(),
            ban.getAccountId(),
            ban.getUsername(),
            ban.getBanType(),
            banTypeLabel(ban.getBanType()),
            ban.getReason(),
            ban.getBannedByUsername(),
            ban.getSourceReportId(),
            ban.getBannedAt(),
            ban.getExpiresAt(),
            ban.getRestoredAt(),
            ban.getRestoreNote(),
            ban.isActive(),
            (int) offenseCount,
            repeatedOffender,
            durationLabel(ban)
        );
    }

    private String durationLabel(PlatformUserBan ban) {
        if ("permanent".equals(ban.getBanType())) {
            return "Permanent";
        }
        if (ban.getExpiresAt() == null) {
            return "Temporary";
        }
        return "Until " + DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)
            .format(ban.getExpiresAt().atZone(ZoneId.systemDefault()));
    }

    private String banTypeLabel(String banType) {
        return "permanent".equals(banType) ? "Permanent ban" : "Temporary suspension";
    }

    private String normalizeBanType(String banType) {
        String normalized = banType.trim().toLowerCase(Locale.ROOT);
        if (!BAN_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ban type");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        return status == null || status.isBlank() ? "active" : status.trim().toLowerCase(Locale.ROOT);
    }
}
