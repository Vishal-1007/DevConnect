package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.AiReviewProperties;
import com.developersconnect.mentor.dto.CodeReviewDtos.AnalyzeCodeReviewRequest;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewReportResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class GeminiCodeReviewService {

    private static final Logger log = LoggerFactory.getLogger(GeminiCodeReviewService.class);

    private final AiReviewProperties properties;
    private final ObjectMapper objectMapper;
    private final CodeReviewHeuristicAnalyzer heuristicAnalyzer;
    private final HttpClient httpClient;

    public GeminiCodeReviewService(
        AiReviewProperties properties,
        ObjectMapper objectMapper,
        CodeReviewHeuristicAnalyzer heuristicAnalyzer
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.heuristicAnalyzer = heuristicAnalyzer;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    }

    public CodeReviewReportResponse analyze(AnalyzeCodeReviewRequest submission) {
        try {
            if (!properties.getGemini().isConfigured()) {
                log.info("Gemini API key not configured; using heuristic analyzer");
                return heuristicAnalyzer.analyze(submission);
            }
            if (!CodeReviewHeuristicAnalyzer.looksLikeSourceCode(submission.code())) {
                return heuristicAnalyzer.analyze(submission);
            }
            try {
                String prompt = buildPrompt(submission);
                String raw = callGemini(prompt);
                CodeReviewReportResponse parsed = parseReport(raw, submission);
                if (parsed != null) {
                    return parsed;
                }
            } catch (Exception ex) {
                log.warn("Gemini code review failed: {}", ex.getMessage());
            }
            return heuristicAnalyzer.analyze(submission);
        } catch (Exception ex) {
            log.error("Code review pipeline failed, returning safe fallback", ex);
            return heuristicAnalyzer.analyzeSafe(submission);
        }
    }

    private String buildPrompt(AnalyzeCodeReviewRequest req) {
        String focus = String.join(", ", req.focusAreas() != null ? req.focusAreas() : List.of());
        String language = nullToEmpty(req.languageLabel());
        String framework = nullToEmpty(req.framework());
        String title = nullToEmpty(req.title());
        String github = req.githubUrl() != null && !req.githubUrl().isBlank() ? req.githubUrl() : "N/A";
        String code = nullToEmpty(req.code());

        return """
            You are a senior staff engineer performing a FAANG-level code review.
            Return ONLY valid JSON (no markdown) matching this schema:
            {
              "overallScore": number 0-10,
              "scores": { "security": number, "performance": number, "architecture": number, "cleanCode": number, "interviewStandard": number },
              "summary": "string",
              "critical": [{ "id": "string", "category": "security|performance|architecture|clean-code|interview-standard", "problem": "", "explanation": "", "solution": "", "codeSuggestion": "" }],
              "improvements": [... same shape ...],
              "goodPractices": [... same shape ...]
            }
            Focus areas to evaluate: """
            + focus
            + "\nLanguage: " + language
            + "\nFramework: " + framework
            + "\nTitle: " + title
            + "\nGitHub: " + github
            + "\nCode:\n```\n" + code + "\n```\n"
            + "Be strict. No minimum score floor. If the submission is not valid source code, say so in critical issues and score below 3.";
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }

    private String callGemini(String prompt) throws Exception {
        AiReviewProperties.Gemini gemini = properties.getGemini();
        Map<String, Object> body = Map.of(
            "contents", new Object[] {
                Map.of("parts", new Object[] { Map.of("text", prompt) })
            },
            "generationConfig", Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json"
            )
        );
        String json = objectMapper.writeValueAsString(body);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
            + gemini.getModel()
            + ":generateContent?key="
            + gemini.getApiKey();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(gemini.getTimeoutSeconds()))
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new IllegalStateException("Gemini HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini returned no candidates");
        }
        String responseText = candidates.path(0).path("content").path("parts").path(0).path("text").asText("");
        if (responseText.isBlank()) {
            throw new IllegalStateException("Gemini returned empty text");
        }
        return responseText;
    }

    private CodeReviewReportResponse parseReport(String raw, AnalyzeCodeReviewRequest submission) {
        try {
            String json = extractJson(raw);
            JsonNode node = objectMapper.readTree(json);
            return CodeReviewReportMapper.fromJson(node, submission, "gemini");
        } catch (Exception ex) {
            log.warn("Could not parse Gemini JSON: {}", ex.getMessage());
            return null;
        }
    }

    private String extractJson(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (start >= 0 && end > start) {
                return trimmed.substring(start + 1, end).trim();
            }
        }
        return trimmed;
    }
}
