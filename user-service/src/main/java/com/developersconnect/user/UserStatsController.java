package com.developersconnect.user;

import com.developersconnect.user.dto.UserStatsResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.UserStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserStatsController {

    private final UserStatsService userStatsService;

    public UserStatsController(UserStatsService userStatsService) {
        this.userStatsService = userStatsService;
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getMyStats(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(userStatsService.getStats(principal.accountId()));
    }
}
