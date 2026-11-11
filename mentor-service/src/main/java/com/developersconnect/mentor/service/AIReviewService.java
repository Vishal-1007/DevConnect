package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CodeReviewDtos.AnalyzeCodeReviewRequest;
import com.developersconnect.mentor.dto.CodeReviewDtos.AiReviewUsageResponse;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewReportResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AIReviewService {

    private final AiUsageService aiUsageService;
    private final GeminiCodeReviewService geminiCodeReviewService;

    public AIReviewService(AiUsageService aiUsageService, GeminiCodeReviewService geminiCodeReviewService) {
        this.aiUsageService = aiUsageService;
        this.geminiCodeReviewService = geminiCodeReviewService;
    }

    @Transactional(readOnly = true)
    public AiReviewUsageResponse getUsage(UUID userId) {
        return aiUsageService.getUsage(userId);
    }

    @Transactional
    public CodeReviewReportResponse analyze(UUID userId, AnalyzeCodeReviewRequest request) {
        validateRequest(request);
        if (!aiUsageService.canAnalyze(userId)) {
            throw new ResponseStatusException(
                HttpStatus.PAYMENT_REQUIRED,
                AiUsageService.PAYMENT_REQUIRED_CODE
            );
        }

        aiUsageService.reserveReview(userId);
        return geminiCodeReviewService.analyze(request);
    }

    private void validateRequest(AnalyzeCodeReviewRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code is required");
        }
        if (request.focusAreas() == null || request.focusAreas().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one review focus area");
        }
        if (request.code().length() > 100_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code submission is too large");
        }
    }
}
