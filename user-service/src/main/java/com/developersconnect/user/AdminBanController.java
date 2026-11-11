package com.developersconnect.user;

import com.developersconnect.user.dto.BanAnalyticsResponse;
import com.developersconnect.user.dto.CreateUserBanRequest;
import com.developersconnect.user.dto.RestoreUserBanRequest;
import com.developersconnect.user.dto.UserBanResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminBanService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/bans")
public class AdminBanController {

    private final AdminBanService adminBanService;

    public AdminBanController(AdminBanService adminBanService) {
        this.adminBanService = adminBanService;
    }

    @GetMapping
    public ResponseEntity<List<UserBanResponse>> listBans(
        @RequestParam(defaultValue = "active") String status
    ) {
        return ResponseEntity.ok(adminBanService.listBans(status));
    }

    @GetMapping("/analytics")
    public ResponseEntity<BanAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminBanService.getAnalytics());
    }

    @PostMapping
    public ResponseEntity<UserBanResponse> createBan(
        Authentication authentication,
        @Valid @RequestBody CreateUserBanRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminBanService.createBan(principal.accountId(), principal.username(), request));
    }

    @PostMapping("/{banId}/restore")
    public ResponseEntity<UserBanResponse> restoreBan(
        @PathVariable UUID banId,
        @RequestBody(required = false) RestoreUserBanRequest request
    ) {
        return ResponseEntity.ok(adminBanService.restoreBan(banId, request));
    }
}
