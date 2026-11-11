package com.developersconnect.user;

import com.developersconnect.user.dto.ConfirmVideoRoomPaymentRequest;
import com.developersconnect.user.dto.VideoRoomOrderResponse;
import com.developersconnect.user.dto.VideoRoomUsageResponse;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.VideoRoomPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/video-rooms/payment")
public class VideoRoomPaymentController {

    private final VideoRoomPaymentService paymentService;

    public VideoRoomPaymentController(VideoRoomPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<VideoRoomOrderResponse> createOrder(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.createOrder(principal.accountId()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<VideoRoomUsageResponse> confirm(
        Authentication authentication,
        @Valid @RequestBody ConfirmVideoRoomPaymentRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.confirmPayment(principal.accountId(), request));
    }
}
