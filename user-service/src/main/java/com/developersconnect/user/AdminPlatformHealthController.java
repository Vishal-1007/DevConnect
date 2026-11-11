package com.developersconnect.user;

import com.developersconnect.user.dto.PlatformHealthResponse;
import com.developersconnect.user.service.PlatformHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/platform-health")
public class AdminPlatformHealthController {

    private final PlatformHealthService platformHealthService;

    public AdminPlatformHealthController(PlatformHealthService platformHealthService) {
        this.platformHealthService = platformHealthService;
    }

    @GetMapping
    public ResponseEntity<PlatformHealthResponse> getHealth() {
        return ResponseEntity.ok(platformHealthService.getHealth());
    }
}
