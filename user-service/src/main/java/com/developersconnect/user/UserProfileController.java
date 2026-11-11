package com.developersconnect.user;

import com.developersconnect.user.dto.CreateUserRatingRequest;
import com.developersconnect.user.dto.UserProfileResponse;
import com.developersconnect.user.dto.UserProfileUpdateRequest;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.UserProfileService;
import com.developersconnect.user.service.UserStreakService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserStreakService userStreakService;

    public UserProfileController(
        UserProfileService userProfileService,
        UserStreakService userStreakService
    ) {
        this.userProfileService = userProfileService;
        this.userStreakService = userStreakService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        userStreakService.recordActivity(principal.accountId());
        return ResponseEntity.ok(userProfileService.getOrCreateProfile(principal.accountId(), principal.username()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(
        Authentication authentication,
        @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(userProfileService.upsertProfile(principal.accountId(), principal.username(), request));
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    public ResponseEntity<UserProfileResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userProfileService.getProfile(id));
    }

    @PostMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/ratings")
    public ResponseEntity<UserProfileResponse> rateUser(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody CreateUserRatingRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userProfileService.rateUser(id, principal.accountId(), request));
    }
}
