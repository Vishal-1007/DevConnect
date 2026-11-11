package com.developersconnect.user;

import com.developersconnect.user.dto.VideoRoomAnalyticsResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.VideoRoomAdminAnalyticsService;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users/admin/video-rooms")
public class AdminVideoRoomAnalyticsController {

    private final VideoRoomAdminAnalyticsService analyticsService;

    public AdminVideoRoomAnalyticsController(VideoRoomAdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<VideoRoomAnalyticsResponse> analytics(Authentication authentication) {
        requireAdmin(authentication);
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

    private static void requireAdmin(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        String roles = principal.roles();
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("ADMIN") && !upper.contains("MODERATOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
