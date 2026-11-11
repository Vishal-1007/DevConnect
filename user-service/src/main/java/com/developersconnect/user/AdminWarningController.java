package com.developersconnect.user;

import com.developersconnect.user.dto.CreateUserWarningRequest;
import com.developersconnect.user.dto.UserWarningResponse;
import com.developersconnect.user.dto.WarningAnalyticsResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.AdminWarningService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/warnings")
public class AdminWarningController {

    private final AdminWarningService adminWarningService;

    public AdminWarningController(AdminWarningService adminWarningService) {
        this.adminWarningService = adminWarningService;
    }

    @GetMapping
    public ResponseEntity<List<UserWarningResponse>> listWarnings(
        @RequestParam(defaultValue = "all") String status
    ) {
        return ResponseEntity.ok(adminWarningService.listWarnings(status));
    }

    @GetMapping("/analytics")
    public ResponseEntity<WarningAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminWarningService.getAnalytics());
    }

    @PostMapping
    public ResponseEntity<UserWarningResponse> createWarning(
        Authentication authentication,
        @Valid @RequestBody CreateUserWarningRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminWarningService.createWarning(principal.accountId(), principal.username(), request));
    }

    @PostMapping("/{warningId}/acknowledge")
    public ResponseEntity<UserWarningResponse> acknowledgeWarning(@PathVariable UUID warningId) {
        return ResponseEntity.ok(adminWarningService.acknowledgeWarning(warningId));
    }

    @DeleteMapping("/{warningId}")
    public ResponseEntity<Void> deleteWarning(@PathVariable UUID warningId) {
        adminWarningService.deleteWarning(warningId);
        return ResponseEntity.noContent().build();
    }
}
