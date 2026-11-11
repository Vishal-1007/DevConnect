package com.developersconnect.auth;

import com.developersconnect.auth.config.JwtProperties;
import com.developersconnect.auth.model.UserAccount;
import com.developersconnect.auth.security.AuthPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
    }

    public String createAccessToken(UserAccount account) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.accessTokenTtlSeconds());

        return Jwts.builder()
            .issuer(properties.issuer())
            .subject(account.getId().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .claim("username", account.getUsername())
            .claim("roles", account.getRoles())
            .signWith(getKey(properties.accessTokenSecret()))
            .compact();
    }

    public Optional<Authentication> getAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        if (!(authentication.getPrincipal() instanceof AuthPrincipal)) {
            return Optional.empty();
        }
        return Optional.of(authentication);
    }

    public Optional<AuthPrincipal> parseAccessToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getKey(properties.accessTokenSecret()))
            .build()
            .parseSignedClaims(token)
            .getPayload();

        UUID accountId = UUID.fromString(claims.getSubject());
        String username = claims.get("username", String.class);
        String roles = claims.get("roles", String.class);

        return Optional.of(new AuthPrincipal(accountId, username, roles));
    }

    public Authentication toAuthentication(AuthPrincipal principal) {
        List<SimpleGrantedAuthority> authorities = Arrays.stream(principal.roles().split(","))
            .map(String::trim)
            .filter(role -> !role.isEmpty())
            .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
            .map(SimpleGrantedAuthority::new)
            .toList();
        return new UsernamePasswordAuthenticationToken(principal, null, authorities);
    }

    private SecretKey getKey(String secret) {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
