package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CodeReviewDtos.ConfirmCodeReviewPaymentRequest;
import com.developersconnect.mentor.security.AuthSupport;
import com.developersconnect.mentor.service.CodeReviewPaymentService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment/code-review")
public class CodeReviewPaymentController {

    private final CodeReviewPaymentService paymentService;

    public CodeReviewPaymentController(CodeReviewPaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(Authentication auth) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(paymentService.createOrder(userId));
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(Authentication auth, @RequestBody ConfirmCodeReviewPaymentRequest body) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(paymentService.confirmPayment(userId, body.paymentId()));
    }
}
