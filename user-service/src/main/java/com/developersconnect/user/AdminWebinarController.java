package com.developersconnect.user;

import com.developersconnect.user.dto.AdminWebinarResponse;
import com.developersconnect.user.dto.CreateAdminWebinarRequest;
import com.developersconnect.user.dto.EventRegistrationResponse;
import com.developersconnect.user.dto.UpdateAdminWebinarRequest;
import com.developersconnect.user.dto.UpdateWebinarStreamRequest;
import com.developersconnect.user.dto.WebinarAnalyticsResponse;
import com.developersconnect.user.service.AdminWebinarService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/webinars")
public class AdminWebinarController {

    private final AdminWebinarService adminWebinarService;

    public AdminWebinarController(AdminWebinarService adminWebinarService) {
        this.adminWebinarService = adminWebinarService;
    }

    @GetMapping
    public ResponseEntity<List<AdminWebinarResponse>> listWebinars(
        @RequestParam(defaultValue = "upcoming") String when,
        @RequestParam(defaultValue = "active") String status,
        @RequestParam(required = false) String subtype,
        @RequestParam(required = false) String hostApproval,
        @RequestParam(required = false) String streamStatus,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(
            adminWebinarService.listWebinars(when, status, subtype, hostApproval, streamStatus, q, limit)
        );
    }

    @GetMapping("/analytics")
    public ResponseEntity<WebinarAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminWebinarService.getAnalytics());
    }

    @GetMapping("/{webinarId}")
    public ResponseEntity<AdminWebinarResponse> getWebinar(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.getWebinar(webinarId));
    }

    @GetMapping("/{webinarId}/attendance")
    public ResponseEntity<List<EventRegistrationResponse>> listAttendance(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.listAttendance(webinarId));
    }

    @PostMapping
    public ResponseEntity<AdminWebinarResponse> createWebinar(
        @Valid @RequestBody CreateAdminWebinarRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminWebinarService.createWebinar(request));
    }

    @PutMapping("/{webinarId}")
    public ResponseEntity<AdminWebinarResponse> updateWebinar(
        @PathVariable UUID webinarId,
        @Valid @RequestBody UpdateAdminWebinarRequest request
    ) {
        return ResponseEntity.ok(adminWebinarService.updateWebinar(webinarId, request));
    }

    @PostMapping("/{webinarId}/approve-host")
    public ResponseEntity<AdminWebinarResponse> approveHost(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.approveHost(webinarId));
    }

    @PostMapping("/{webinarId}/reject-host")
    public ResponseEntity<AdminWebinarResponse> rejectHost(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.rejectHost(webinarId));
    }

    @PostMapping("/{webinarId}/go-live")
    public ResponseEntity<AdminWebinarResponse> goLive(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.goLive(webinarId));
    }

    @PostMapping("/{webinarId}/end-stream")
    public ResponseEntity<AdminWebinarResponse> endStream(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.endStream(webinarId));
    }

    @PutMapping("/{webinarId}/stream")
    public ResponseEntity<AdminWebinarResponse> updateStream(
        @PathVariable UUID webinarId,
        @Valid @RequestBody UpdateWebinarStreamRequest request
    ) {
        return ResponseEntity.ok(adminWebinarService.updateStream(webinarId, request));
    }

    @PostMapping("/{webinarId}/attendance/{userId}/check-in")
    public ResponseEntity<EventRegistrationResponse> checkInAttendee(
        @PathVariable UUID webinarId,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminWebinarService.checkInAttendee(webinarId, userId));
    }

    @DeleteMapping("/{webinarId}")
    public ResponseEntity<AdminWebinarResponse> cancelWebinar(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.cancelWebinar(webinarId));
    }

    @PostMapping("/{webinarId}/restore")
    public ResponseEntity<AdminWebinarResponse> restoreWebinar(@PathVariable UUID webinarId) {
        return ResponseEntity.ok(adminWebinarService.restoreWebinar(webinarId));
    }
}
