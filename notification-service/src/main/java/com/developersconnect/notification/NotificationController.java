package com.developersconnect.notification;

import com.developersconnect.notification.dto.CreateNotificationRequest;
import com.developersconnect.notification.dto.NotificationResponse;
import com.developersconnect.notification.dto.UnreadCountResponse;
import com.developersconnect.notification.security.AuthPrincipal;
import com.developersconnect.notification.service.NotificationService;
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
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> create(
        Authentication authentication,
        @Valid @RequestBody CreateNotificationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        boolean isAdmin = principal.roles().toUpperCase().contains("ADMIN");
        if (!isAdmin && !principal.accountId().equals(request.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(
        Authentication authentication,
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(required = false) String filter
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return ResponseEntity.ok(notificationService.list(principal.accountId(), safeLimit, filter));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(principal.accountId())));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Integer> markAllRead(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markAllRead(principal.accountId()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markRead(id, principal.accountId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        notificationService.delete(id, principal.accountId());
        return ResponseEntity.noContent().build();
    }
}
