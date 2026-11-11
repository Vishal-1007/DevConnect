package com.developersconnect.user;

import com.developersconnect.user.service.AdminFeatureService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/platform")
public class PlatformFeatureController {

    private final AdminFeatureService adminFeatureService;

    public PlatformFeatureController(AdminFeatureService adminFeatureService) {
        this.adminFeatureService = adminFeatureService;
    }

    @GetMapping("/features")
    public ResponseEntity<Map<String, Boolean>> getFeatures() {
        return ResponseEntity.ok(adminFeatureService.getPublicFlags());
    }
}
