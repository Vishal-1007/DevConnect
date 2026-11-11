package com.developersconnect.user;

import com.developersconnect.user.dto.LeaderboardResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
        Authentication authentication,
        @RequestParam(defaultValue = "all") String period,
        @RequestParam(defaultValue = "overall") String category,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            leaderboardService.getLeaderboard(principal.accountId(), period, category, limit)
        );
    }
}
