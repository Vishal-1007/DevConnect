package com.developersconnect.user;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.dto.CreateBreakoutRoomRequest;
import com.developersconnect.user.dto.CreateVideoRoomRequest;
import com.developersconnect.user.dto.SendVideoRoomMessageRequest;
import com.developersconnect.user.dto.SetParticipantCameraRequest;
import com.developersconnect.user.dto.SetParticipantMutedRequest;
import com.developersconnect.user.dto.UpdateVideoRoomPermissionsRequest;
import com.developersconnect.user.dto.VideoRoomJoinPreviewResponse;
import com.developersconnect.user.dto.VideoRoomLimitCheckResponse;
import com.developersconnect.user.dto.VideoRoomMessageResponse;
import com.developersconnect.user.dto.VideoRoomParticipantResponse;
import com.developersconnect.user.dto.VideoRoomResponse;
import com.developersconnect.user.dto.VideoRoomUsageResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.VideoRoomService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users/video-rooms")
public class VideoRoomController {

    private final VideoRoomService videoRoomService;

    public VideoRoomController(VideoRoomService videoRoomService) {
        this.videoRoomService = videoRoomService;
    }

    @GetMapping("/usage")
    public ResponseEntity<VideoRoomUsageResponse> getUsage(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.getUsage(principal.accountId()));
    }

    @GetMapping("/join/{roomCode}/preview")
    public ResponseEntity<VideoRoomJoinPreviewResponse> joinPreview(@PathVariable String roomCode) {
        return ResponseEntity.ok(videoRoomService.getJoinPreview(roomCode));
    }

    @PostMapping("/join/{roomCode}")
    public ResponseEntity<VideoRoomResponse> joinByCode(
        Authentication authentication,
        @PathVariable String roomCode
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.joinRoomByCode(roomCode, principal.accountId()));
    }

    @GetMapping("/check-limit/me")
    public ResponseEntity<VideoRoomLimitCheckResponse> checkMyLimit(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.checkCreateLimit(principal.accountId()));
    }

    @GetMapping("/check-limit/{userId}")
    public ResponseEntity<VideoRoomLimitCheckResponse> checkLimit(
        Authentication authentication,
        @PathVariable UUID userId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        if (!principal.accountId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot check limit for another user");
        }
        return ResponseEntity.ok(videoRoomService.checkCreateLimit(userId));
    }

    @GetMapping("/live")
    public ResponseEntity<List<VideoRoomResponse>> listLiveRooms(
        Authentication authentication,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.listLiveRooms(principal.accountId(), category, q, limit)
        );
    }

    @GetMapping
    public ResponseEntity<List<VideoRoomResponse>> listRooms(
        Authentication authentication,
        @RequestParam(defaultValue = "live") String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String roomType,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.listRooms(
                principal.accountId(), status, category, roomType, q, limit
            )
        );
    }

    @PostMapping({ "", "/create" })
    public ResponseEntity<VideoRoomResponse> createRoom(
        Authentication authentication,
        @Valid @RequestBody CreateVideoRoomRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(videoRoomService.createRoom(principal.accountId(), principal.username(), request));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<VideoRoomResponse> getRoom(
        Authentication authentication,
        @PathVariable UUID roomId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.getRoom(roomId, principal.accountId()));
    }

    @GetMapping("/{roomId}/participants")
    public ResponseEntity<List<VideoRoomParticipantResponse>> listParticipants(
        Authentication authentication,
        @PathVariable UUID roomId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.listParticipants(roomId, principal.accountId()));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<VideoRoomResponse> joinRoom(
        Authentication authentication,
        @PathVariable UUID roomId,
        @RequestParam(defaultValue = "false") boolean direct
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.joinRoom(roomId, principal.accountId(), direct));
    }

    @PostMapping("/{roomId}/join-requests/{userId}/approve")
    public ResponseEntity<VideoRoomResponse> approveJoinRequest(
        Authentication authentication,
        @PathVariable UUID roomId,
        @PathVariable UUID userId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.approveJoinRequest(roomId, principal.accountId(), userId)
        );
    }

    @PostMapping("/{roomId}/join-requests/{userId}/reject")
    public ResponseEntity<VideoRoomResponse> rejectJoinRequest(
        Authentication authentication,
        @PathVariable UUID roomId,
        @PathVariable UUID userId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.rejectJoinRequest(roomId, principal.accountId(), userId)
        );
    }

    @DeleteMapping("/{roomId}/join")
    public ResponseEntity<VideoRoomResponse> leaveRoom(
        Authentication authentication,
        @PathVariable UUID roomId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.leaveRoom(roomId, principal.accountId()));
    }

    @PostMapping("/{roomId}/end")
    public ResponseEntity<VideoRoomResponse> endRoom(
        Authentication authentication,
        @PathVariable UUID roomId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.endRoom(roomId, principal.accountId(), principal.roles())
        );
    }

    @PutMapping("/{roomId}/permissions")
    public ResponseEntity<VideoRoomResponse> updatePermissions(
        Authentication authentication,
        @PathVariable UUID roomId,
        @Valid @RequestBody UpdateVideoRoomPermissionsRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.updatePermissions(
                roomId, principal.accountId(), principal.roles(), request
            )
        );
    }

    @PutMapping("/{roomId}/participants/{userId}/mute")
    public ResponseEntity<VideoRoomResponse> setParticipantMuted(
        Authentication authentication,
        @PathVariable UUID roomId,
        @PathVariable UUID userId,
        @Valid @RequestBody SetParticipantMutedRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.setParticipantMuted(
                roomId, principal.accountId(), principal.roles(), userId, request
            )
        );
    }

    @PutMapping("/{roomId}/participants/{userId}/camera")
    public ResponseEntity<VideoRoomResponse> setParticipantCamera(
        Authentication authentication,
        @PathVariable UUID roomId,
        @PathVariable UUID userId,
        @Valid @RequestBody SetParticipantCameraRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.setParticipantCamera(
                roomId, principal.accountId(), principal.roles(), userId, request
            )
        );
    }

    @DeleteMapping("/{roomId}/participants/{userId}")
    public ResponseEntity<VideoRoomResponse> removeParticipant(
        Authentication authentication,
        @PathVariable UUID roomId,
        @PathVariable UUID userId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            videoRoomService.removeParticipant(
                roomId, principal.accountId(), principal.roles(), userId
            )
        );
    }

    @PostMapping("/{roomId}/breakouts")
    public ResponseEntity<VideoRoomResponse> createBreakout(
        Authentication authentication,
        @PathVariable UUID roomId,
        @Valid @RequestBody CreateBreakoutRoomRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(
                videoRoomService.createBreakout(
                    roomId, principal.accountId(), principal.roles(), request
                )
            );
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<VideoRoomMessageResponse>> listMessages(
        Authentication authentication,
        @PathVariable UUID roomId,
        @RequestParam(defaultValue = "100") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(videoRoomService.listMessages(roomId, principal.accountId(), limit));
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<VideoRoomMessageResponse> sendMessage(
        Authentication authentication,
        @PathVariable UUID roomId,
        @Valid @RequestBody SendVideoRoomMessageRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(videoRoomService.sendMessage(roomId, principal.accountId(), request));
    }
}
