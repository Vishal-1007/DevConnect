package com.developersconnect.matching;

import com.developersconnect.matching.config.JwtProperties;
import com.developersconnect.matching.security.AuthPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
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
