package com.developersconnect.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.user.dto.FeatureFlagResponse;
import com.developersconnect.user.dto.FeatureFlagsOverviewResponse;
import com.developersconnect.user.dto.ToggleFeatureRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminFeatureService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/admin/features")
public class AdminFeatureController {

    private final AdminFeatureService adminFeatureService;

    public AdminFeatureController(AdminFeatureService adminFeatureService) {
        this.adminFeatureService = adminFeatureService;
    }

    @GetMapping
    public ResponseEntity<FeatureFlagsOverviewResponse> listFeatures() {
        return ResponseEntity.ok(adminFeatureService.getOverview());
    }

    @PutMapping("/{featureKey}")
    public ResponseEntity<FeatureFlagResponse> toggleFeature(
        Authentication authentication,
        @PathVariable String featureKey,
        @Valid @RequestBody ToggleFeatureRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            adminFeatureService.toggleFeature(featureKey, request.enabled(), principal.username())
        );
    }
}
