package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CodeReviewDtos.AnalyzeCodeReviewRequest;
import com.developersconnect.mentor.dto.CodeReviewDtos.PaymentRequiredResponse;
import com.developersconnect.mentor.security.AuthSupport;
import com.developersconnect.mentor.service.AIReviewService;
import com.developersconnect.mentor.service.AiUsageService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai-review")
public class AIReviewController {

    private final AIReviewService aiReviewService;
    private final AiUsageService aiUsageService;

    public AIReviewController(AIReviewService aiReviewService, AiUsageService aiUsageService) {
        this.aiReviewService = aiReviewService;
        this.aiUsageService = aiUsageService;
    }

    @GetMapping("/usage")
    public ResponseEntity<?> usage(Authentication auth) {
        UUID userId = AuthSupport.requireUserId(auth);
        return ResponseEntity.ok(aiReviewService.getUsage(userId));
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(Authentication auth, @RequestBody AnalyzeCodeReviewRequest body) {
        UUID userId = AuthSupport.requireUserId(auth);
        try {
            return ResponseEntity.ok(aiReviewService.analyze(userId, body));
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode() == HttpStatus.PAYMENT_REQUIRED) {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
                    new PaymentRequiredResponse(
                        AiUsageService.PAYMENT_REQUIRED_CODE,
                        "Daily free AI review limit reached. Purchase an extra review to continue.",
                        aiUsageService.getUsage(userId)
                    )
                );
            }
            throw ex;
        }
    }
}
