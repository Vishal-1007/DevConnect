package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CodeReviewDtos;
import com.developersconnect.mentor.dto.CodeReviewDtos.AnalyzeCodeReviewRequest;
import com.developersconnect.mentor.dto.CodeReviewDtos.CategoryScoresDto;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewIssueDto;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewReportResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class CodeReviewHeuristicAnalyzer {

    private final ObjectMapper objectMapper;

    public CodeReviewHeuristicAnalyzer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public CodeReviewReportResponse analyzeSafe(AnalyzeCodeReviewRequest submission) {
        try {
            return analyze(submission);
        } catch (Exception ex) {
            return buildInvalidSubmissionReport(
                submission != null ? submission : emptySubmission(),
                "Analysis could not be completed. Please paste valid source code and try again."
            );
        }
    }

    public CodeReviewReportResponse analyze(AnalyzeCodeReviewRequest submission) {
        String code = submission.code() != null ? submission.code() : "";
        List<String> focusList = submission.focusAreas() != null ? submission.focusAreas() : List.of();
        Set<String> focus = new LinkedHashSet<>(focusList);

        if (!looksLikeSourceCode(code)) {
            return buildInvalidSubmissionReport(submission, null);
        }

        List<CodeReviewIssueDto> issues = new ArrayList<>();

        if (focus.contains("security")) {
            if (code.matches("(?is).*(password\\s*:\\s*['\"][^'\"]+['\"]|username\\s*:\\s*['\"]admin['\"]).*")
                && code.contains("userCredentials")) {
                issues.add(issue("hardcoded-creds", "critical", "security",
                    "Hardcoded credentials in source code",
                    "Admin username/password are stored in plain text in the application.",
                    "Load secrets from environment variables or a secure vault; never commit credentials.",
                    "const userCredentials = { username: process.env.ADMIN_USER, password: process.env.ADMIN_PASS };"));
            }
            if (code.matches("(?s).*(setPassword\\s*\\([^)]*getPassword|password\\s*=\\s*req\\.).*")
                && !code.toLowerCase().contains("encode") && !code.toLowerCase().contains("hash")) {
                issues.add(issue("plain-password", "critical", "security",
                    "Plain password handling detected",
                    "Passwords are stored without hashing.",
                    "Use BCrypt/Argon2 before persistence.",
                    "user.setPassword(passwordEncoder.encode(req.getPassword()));"));
            }
            if (code.contains("register") && !code.contains("@Valid")) {
                issues.add(issue("no-validation", "critical", "security",
                    "Missing input validation",
                    "User input is accepted without server-side validation.",
                    "Add @Valid and constraint annotations on DTOs.",
                    "public User register(@Valid @RequestBody RegisterRequest req)"));
            }
        }

        if (focus.contains("performance")) {
            if (code.contains("useEffect") && !code.contains("], [") && !code.contains("],[]")) {
                issues.add(issue("infinite-effect", "critical", "performance",
                    "useEffect may run on every render",
                    "Fetching without a dependency array can cause infinite loops.",
                    "Add an empty or explicit dependency array.",
                    "useEffect(() => { fetch(...); }, []);"));
            }
            if (code.contains("Math.random()")) {
                issues.add(issue("random-key", "critical", "performance",
                    "Unstable React list keys",
                    "Math.random() keys hurt reconciliation performance.",
                    "Use stable IDs as keys.",
                    "<li key={u.id}>{u.name}</li>"));
            }
        }

        if (focus.contains("architecture") && code.contains("@Service")) {
            issues.add(issue("layered", "good", "architecture",
                "Layered architecture detected",
                "Service layer separation supports maintainability.",
                "Keep controllers thin and business logic in services.",
                null));
        }

        if (focus.contains("clean-code") && code.matches("(?s).*(UserRegistration|RegisterRequest).*")) {
            issues.add(issue("naming", "good", "clean-code",
                "Clear naming conventions",
                "Descriptive names improve readability.",
                "Continue domain-driven naming.",
                null));
        }

        if (focus.contains("interview-standard") && code.length() > 80 && !code.contains("@Test")) {
            issues.add(issue("no-tests", "improvement", "interview-standard",
                "No visible test coverage",
                "Interview-grade code usually includes tests.",
                "Add unit tests for core flows.",
                "@Test void register_hashesPassword() { }"));
        }

        if (issues.stream().noneMatch(i -> "good".equals(i.severity()))) {
            issues.add(issue("readable", "good", "clean-code",
                "Readable structure",
                "Code is structured clearly enough for review.",
                "Keep functions small and focused.",
                null));
        }

        List<CodeReviewIssueDto> critical = issues.stream().filter(i -> "critical".equals(i.severity())).toList();
        List<CodeReviewIssueDto> improvements = issues.stream().filter(i -> "improvement".equals(i.severity())).toList();
        List<CodeReviewIssueDto> good = issues.stream().filter(i -> "good".equals(i.severity())).toList();

        Map<String, Double> scoreMap = new HashMap<>();
        for (String area : focus) {
            scoreMap.put(area, scoreFor(area, issues));
        }
        CategoryScoresDto scores = CodeReviewDtos.fromMap(scoreMap);
        double overall = focus.isEmpty() ? 7.0 : scoreMap.values().stream().mapToDouble(Double::doubleValue).average().orElse(7.0);

        String summary = critical.isEmpty()
            ? (improvements.isEmpty()
                ? "Strong code quality signals detected."
                : "Good foundation with improvements suggested.")
            : critical.size() + " critical issue(s) require attention before production.";

        return new CodeReviewReportResponse(
            round(overall),
            scores,
            critical,
            improvements,
            good,
            summary,
            submission,
            "heuristic"
        );
    }

    private double scoreFor(String area, List<CodeReviewIssueDto> issues) {
        double score = 8.5;
        for (CodeReviewIssueDto i : issues) {
            if (!area.equals(i.category())) continue;
            if ("critical".equals(i.severity())) score -= 1.8;
            else if ("improvement".equals(i.severity())) score -= 0.6;
            else score += 0.4;
        }
        return round(Math.min(10, Math.max(0, score)));
    }

    private CodeReviewIssueDto issue(
        String id, String severity, String category,
        String problem, String explanation, String solution, String suggestion
    ) {
        return new CodeReviewIssueDto(id, severity, category, problem, explanation, solution, suggestion);
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    /**
     * Detects random text, notes, or corrupted uploads that are not source code.
     */
    public static boolean looksLikeSourceCode(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        String trimmed = code.trim();
        if (trimmed.length() < 12) {
            return false;
        }
        String lower = trimmed.toLowerCase();
        boolean hasCodeTokens =
            lower.contains("class ")
                || lower.contains("interface ")
                || lower.contains("function ")
                || lower.contains("def ")
                || lower.contains("public ")
                || lower.contains("private ")
                || lower.contains("import ")
                || lower.contains("package ")
                || lower.contains("const ")
                || lower.contains("let ")
                || lower.contains("var ")
                || lower.contains("require(")
                || lower.contains("module.exports")
                || lower.contains("app.post")
                || lower.contains("app.get")
                || lower.contains("express")
                || lower.contains("return ")
                || lower.contains("@")
                || trimmed.contains("{")
                || trimmed.contains("};")
                || trimmed.contains("();")
                || trimmed.contains("=>");

        long letterWords = 0;
        for (String word : trimmed.split("\\s+")) {
            if (word.length() >= 3 && word.chars().filter(Character::isLetter).count() >= word.length() * 0.6) {
                letterWords++;
            }
        }

        return hasCodeTokens || letterWords >= 2;
    }

    private CodeReviewReportResponse buildInvalidSubmissionReport(
        AnalyzeCodeReviewRequest submission,
        String customSummary
    ) {
        List<String> focusList = submission.focusAreas() != null ? submission.focusAreas() : List.of();
        Set<String> focus = new LinkedHashSet<>(focusList);

        CodeReviewIssueDto critical = issue(
            "not-source-code",
            "critical",
            "interview-standard",
            "Submission is not valid source code",
            "The uploaded content looks like random text or notes, not compilable source code in the selected language.",
            "Paste a real code file (e.g. .java, .ts, .py) or use a sample snippet from Quick load.",
            null
        );

        Map<String, Double> scoreMap = new HashMap<>();
        for (String area : focus) {
            scoreMap.put(area, 1.5);
        }
        CategoryScoresDto scores = CodeReviewDtos.fromMap(scoreMap);
        double overall = focus.isEmpty() ? 1.5 : 1.5;

        return new CodeReviewReportResponse(
            overall,
            scores,
            List.of(critical),
            List.of(),
            List.of(),
            customSummary != null
                ? customSummary
                : "We could not analyze this as code. Please upload or paste actual source code.",
            submission,
            "heuristic"
        );
    }

    private AnalyzeCodeReviewRequest emptySubmission() {
        return new AnalyzeCodeReviewRequest("", "", "", "", "", "", List.of());
    }

    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}
