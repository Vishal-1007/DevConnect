package com.developersconnect.auth;

import com.developersconnect.auth.dto.AccountResponse;
import com.developersconnect.auth.dto.AdminAccountResponse;
import com.developersconnect.auth.dto.LoginRequest;
import com.developersconnect.auth.dto.LoginResponse;
import com.developersconnect.auth.dto.RefreshRequest;
import com.developersconnect.auth.dto.RegisterRequest;
import com.developersconnect.auth.dto.UpdateRoleRequest;
import com.developersconnect.auth.model.RefreshToken;
import com.developersconnect.auth.model.UserAccount;
import com.developersconnect.auth.repository.RefreshTokenRepository;
import com.developersconnect.auth.repository.UserAccountRepository;
import com.developersconnect.auth.security.AuthPrincipal;
import com.developersconnect.auth.security.TokenGenerator;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE = "USER";

    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenGenerator tokenGenerator;

    public AuthService(
        JwtService jwtService,
        UserAccountRepository userAccountRepository,
        RefreshTokenRepository refreshTokenRepository,
        PasswordEncoder passwordEncoder,
        TokenGenerator tokenGenerator
    ) {
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenGenerator = tokenGenerator;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase();

        if (username.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must be at least 3 characters");
        }

        if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Username already in use. Try logging in instead."
            );
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Email already in use. Try logging in instead."
            );
        }

        UserAccount account = new UserAccount();
        account.setUsername(username);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRoles(resolveSignupRole(request.role()));
        account.setEnabled(true);

        UserAccount saved = userAccountRepository.save(account);
        if (saved.getId() == null) {
            throw new IllegalStateException("User id was not generated");
        }

        String accessToken = jwtService.createAccessToken(saved);
        String refreshTokenValue = issueRefreshToken(saved);

        return new LoginResponse(accessToken, refreshTokenValue);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Optional<UserAccount> accountOpt = userAccountRepository
            .findByUsernameIgnoreCase(request.username())
            .or(() -> userAccountRepository.findByEmailIgnoreCase(request.username()));

        UserAccount account = accountOpt.orElseThrow(() ->
            new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
        );

        if (!account.isEnabled() || !passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String accessToken = jwtService.createAccessToken(account);
        String refreshTokenValue = issueRefreshToken(account);

        return new LoginResponse(accessToken, refreshTokenValue);
    }

    @Transactional
    public LoginResponse refresh(RefreshRequest request) {
        String rawToken = request.refreshToken();
        String tokenHash = tokenGenerator.hash(rawToken);
        RefreshToken existing = refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNull(tokenHash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (existing.getExpiresAt().isBefore(Instant.now())) {
            revokeToken(existing);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserAccount account = existing.getUserAccount();
        revokeToken(existing);

        String accessToken = jwtService.createAccessToken(account);
        String refreshTokenValue = issueRefreshToken(account);

        return new LoginResponse(accessToken, refreshTokenValue);
    }

    @Transactional(readOnly = true)
    public AccountResponse getCurrentAccount() {
        Authentication authentication = jwtService.getAuthentication()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        UUID accountId = principal.accountId();

        UserAccount account = userAccountRepository.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        return new AccountResponse(
            account.getId(),
            account.getUsername(),
            account.getEmail(),
            account.getRoles()
        );
    }

    private String issueRefreshToken(UserAccount account) {
        String rawToken = tokenGenerator.generate();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserAccount(account);
        refreshToken.setTokenHash(tokenGenerator.hash(rawToken));
        refreshToken.setExpiresAt(Instant.now().plusSeconds(60L * 60L * 24L * 14L));

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    // ── Admin operations ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminAccountResponse> listAllAccounts() {
        return userAccountRepository.findAll().stream()
            .map(a -> new AdminAccountResponse(a.getId(), a.getUsername(), a.getEmail(),
                a.getRoles(), a.isEnabled(), a.getCreatedAt()))
            .collect(Collectors.toList());
    }

    @Transactional
    public AdminAccountResponse updateRole(UUID accountId, UpdateRoleRequest request) {
        UserAccount account = userAccountRepository.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        account.setRoles(request.roles().toUpperCase());
        UserAccount saved = userAccountRepository.save(account);
        return new AdminAccountResponse(saved.getId(), saved.getUsername(), saved.getEmail(),
            saved.getRoles(), saved.isEnabled(), saved.getCreatedAt());
    }

    @Transactional
    public AdminAccountResponse toggleEnabled(UUID accountId) {
        UserAccount account = userAccountRepository.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        account.setEnabled(!account.isEnabled());
        UserAccount saved = userAccountRepository.save(account);
        return new AdminAccountResponse(saved.getId(), saved.getUsername(), saved.getEmail(),
            saved.getRoles(), saved.isEnabled(), saved.getCreatedAt());
    }

    private void revokeToken(RefreshToken token) {
        token.setRevokedAt(Instant.now());
        token.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(token);
    }

    private String resolveSignupRole(String role) {
        if (role == null || role.isBlank()) {
            return DEFAULT_ROLE;
        }
        String normalized = role.trim().toUpperCase();
        return switch (normalized) {
            case "RECRUITER" -> "RECRUITER";
            case "MENTOR" -> "USER";
            case "USER", "CANDIDATE" -> "USER";
            default -> DEFAULT_ROLE;
        };
    }
}
