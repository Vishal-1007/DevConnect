package com.developersconnect.auth;

import com.developersconnect.auth.dto.AdminAccountResponse;
import com.developersconnect.auth.dto.LoginRequest;
import com.developersconnect.auth.dto.LoginResponse;
import com.developersconnect.auth.dto.AccountResponse;
import com.developersconnect.auth.dto.RefreshRequest;
import com.developersconnect.auth.dto.RegisterRequest;
import com.developersconnect.auth.dto.UpdateRoleRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me() {
        return ResponseEntity.ok(authService.getCurrentAccount());
    }

    // ── Admin endpoints ──────────────────────────────────────────────────────

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminAccountResponse>> listUsers() {
        return ResponseEntity.ok(authService.listAllAccounts());
    }

    @PatchMapping("/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAccountResponse> updateRole(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(authService.updateRole(id, request));
    }

    @PostMapping("/admin/users/{id}/toggle-enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminAccountResponse> toggleEnabled(@PathVariable UUID id) {
        return ResponseEntity.ok(authService.toggleEnabled(id));
    }
}
