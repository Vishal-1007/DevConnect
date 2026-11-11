package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.dto.GenerateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.dto.MentorInterviewQuestionResponse;
import com.developersconnect.mentor.dto.UpdateMentorInterviewQuestionRequest;
import com.developersconnect.mentor.model.MentorInterviewQuestion;
import com.developersconnect.mentor.model.MentorInterviewQuestionSave;
import com.developersconnect.mentor.repository.MentorInterviewQuestionRepository;
import com.developersconnect.mentor.repository.MentorInterviewQuestionSaveRepository;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorInterviewQuestionService {

    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US).withZone(ZoneId.systemDefault());

    private static final Map<String, String> CATEGORY_LABELS = new LinkedHashMap<>();
    private static final Map<String, String> DIFFICULTY_LABELS = Map.of(
        "easy", "Easy",
        "medium", "Medium",
        "hard", "Hard",
        "expert", "Expert"
    );

    static {
        CATEGORY_LABELS.put("dsa", "DSA");
        CATEGORY_LABELS.put("system_design", "System Design");
        CATEGORY_LABELS.put("java", "Java");
        CATEGORY_LABELS.put("react", "React");
        CATEGORY_LABELS.put("spring_boot", "Spring Boot");
        CATEGORY_LABELS.put("javascript", "JavaScript");
        CATEGORY_LABELS.put("sql", "SQL");
        CATEGORY_LABELS.put("aptitude", "Aptitude");
        CATEGORY_LABELS.put("custom", "Custom");
        CATEGORY_LABELS.put("hr", "HR");
    }

    private static final Set<String> CATEGORIES = CATEGORY_LABELS.keySet();
    private static final Set<String> DIFFICULTIES = DIFFICULTY_LABELS.keySet();

    private final MentorInterviewQuestionRepository questionRepository;
    private final MentorInterviewQuestionSaveRepository saveRepository;
    private final MentorProfileService mentorProfileService;

    public MentorInterviewQuestionService(
        MentorInterviewQuestionRepository questionRepository,
        MentorInterviewQuestionSaveRepository saveRepository,
        MentorProfileService mentorProfileService
    ) {
        this.questionRepository = questionRepository;
        this.saveRepository = saveRepository;
        this.mentorProfileService = mentorProfileService;
    }

    @Transactional(readOnly = true)
    public List<MentorInterviewQuestionResponse> listQuestions(
        UUID mentorId,
        String category,
        String difficulty,
        String search,
        String view
    ) {
        requireApprovedMentor(mentorId);
        Set<UUID> savedIds = saveRepository.findByMentorId(mentorId).stream()
            .map(MentorInterviewQuestionSave::getQuestionId)
            .collect(java.util.stream.Collectors.toSet());

        String normalizedCategory = normalize(category, "all");
        String normalizedDifficulty = normalize(difficulty, "all");
        String normalizedView = normalize(view, "all");
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<MentorInterviewQuestion> combined = new ArrayList<>();
        combined.addAll(questionRepository.findByMentorIdIsNullOrderByCategoryAscDifficultyAsc());
        combined.addAll(questionRepository.findByMentorIdOrderByUpdatedAtDesc(mentorId));

        return combined.stream()
            .filter(q -> matchesCategory(q, normalizedCategory))
            .filter(q -> matchesDifficulty(q, normalizedDifficulty))
            .filter(q -> matchesView(q, normalizedView, savedIds, mentorId))
            .filter(q -> matchesSearch(q, query))
            .sorted(Comparator
                .comparing(MentorInterviewQuestion::getCategory)
                .thenComparing(q -> difficultyOrder(q.getDifficulty()))
                .thenComparing(MentorInterviewQuestion::getQuestionText))
            .map(q -> toResponse(q, savedIds.contains(q.getId()), mentorId))
            .toList();
    }

    @Transactional
    public MentorInterviewQuestionResponse createQuestion(UUID mentorId, CreateMentorInterviewQuestionRequest request) {
        requireApprovedMentor(mentorId);
        validateCategory(request.category());
        validateDifficulty(request.difficulty());

        MentorInterviewQuestion question = new MentorInterviewQuestion();
        question.setMentorId(mentorId);
        question.setCategory(normalizeCategory(request.category()));
        question.setDifficulty(normalizeDifficulty(request.difficulty()));
        question.setQuestionText(request.questionText().trim());
        question.setFollowUps(trimOrNull(request.followUps()));
        question.setEvaluationHints(trimOrNull(request.evaluationHints()));
        question.setAiGenerated(false);
        question.setTemplate(request.template());

        MentorInterviewQuestion saved = questionRepository.save(question);
        return toResponse(saved, false, mentorId);
    }

    @Transactional
    public MentorInterviewQuestionResponse updateQuestion(
        UUID mentorId,
        UUID questionId,
        UpdateMentorInterviewQuestionRequest request
    ) {
        requireApprovedMentor(mentorId);
        MentorInterviewQuestion question = requireOwnedQuestion(mentorId, questionId);

        if (request.category() != null) {
            validateCategory(request.category());
            question.setCategory(normalizeCategory(request.category()));
        }
        if (request.difficulty() != null) {
            validateDifficulty(request.difficulty());
            question.setDifficulty(normalizeDifficulty(request.difficulty()));
        }
        if (request.questionText() != null) {
            if (request.questionText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question text cannot be blank");
            }
            question.setQuestionText(request.questionText().trim());
        }
        if (request.followUps() != null) {
            question.setFollowUps(trimOrNull(request.followUps()));
        }
        if (request.evaluationHints() != null) {
            question.setEvaluationHints(trimOrNull(request.evaluationHints()));
        }
        if (request.template() != null) {
            question.setTemplate(request.template());
        }

        boolean saved = saveRepository.existsByMentorIdAndQuestionId(mentorId, questionId);
        return toResponse(questionRepository.save(question), saved, mentorId);
    }

    @Transactional
    public MentorInterviewQuestionResponse toggleSave(UUID mentorId, UUID questionId) {
        requireApprovedMentor(mentorId);
        MentorInterviewQuestion question = questionRepository.findById(questionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        boolean saved;
        if (saveRepository.existsByMentorIdAndQuestionId(mentorId, questionId)) {
            saveRepository.deleteByMentorIdAndQuestionId(mentorId, questionId);
            saved = false;
        } else {
            MentorInterviewQuestionSave entry = new MentorInterviewQuestionSave();
            entry.setMentorId(mentorId);
            entry.setQuestionId(questionId);
            saveRepository.save(entry);
            saved = true;
        }

        return toResponse(question, saved, mentorId);
    }

    @Transactional
    public MentorInterviewQuestionResponse generateQuestion(
        UUID mentorId,
        GenerateMentorInterviewQuestionRequest request
    ) {
        requireApprovedMentor(mentorId);
        validateCategory(request.category());
        validateDifficulty(request.difficulty());

        GeneratedQuestion generated = generateAiQuestion(
            normalizeCategory(request.category()),
            normalizeDifficulty(request.difficulty()),
            request.topic()
        );

        MentorInterviewQuestion question = new MentorInterviewQuestion();
        question.setMentorId(mentorId);
        question.setCategory(normalizeCategory(request.category()));
        question.setDifficulty(normalizeDifficulty(request.difficulty()));
        question.setQuestionText(generated.questionText());
        question.setFollowUps(generated.followUps());
        question.setEvaluationHints(generated.evaluationHints());
        question.setAiGenerated(true);
        question.setTemplate(request.saveAsTemplate());

        MentorInterviewQuestion saved = questionRepository.save(question);
        return toResponse(saved, false, mentorId);
    }

    @Transactional
    public void deleteQuestion(UUID mentorId, UUID questionId) {
        requireApprovedMentor(mentorId);
        MentorInterviewQuestion question = requireOwnedQuestion(mentorId, questionId);
        saveRepository.deleteByMentorIdAndQuestionId(mentorId, questionId);
        question.setDeletedAt(java.time.Instant.now());
        questionRepository.save(question);
    }

    @Transactional
    public MentorInterviewQuestionResponse copyQuestion(UUID mentorId, UUID questionId) {
        requireApprovedMentor(mentorId);
        MentorInterviewQuestion source = questionRepository.findById(questionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        MentorInterviewQuestion copy = new MentorInterviewQuestion();
        copy.setMentorId(mentorId);
        copy.setCategory(source.getCategory());
        copy.setDifficulty(source.getDifficulty());
        copy.setQuestionText(source.getQuestionText());
        copy.setTitle(source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setExpectedAnswer(source.getExpectedAnswer());
        copy.setTags(source.getTags());
        copy.setEstimatedMinutes(source.getEstimatedMinutes());
        copy.setReferenceLinks(source.getReferenceLinks());
        copy.setFollowUps(source.getFollowUps());
        copy.setEvaluationHints(source.getEvaluationHints());
        copy.setAiGenerated(false);
        copy.setTemplate(source.isTemplate());
        copy.setCreatedBy(mentorId);
        copy.setUpdatedBy(mentorId);
        return toResponse(questionRepository.save(copy), false, mentorId);
    }

    @Transactional
    public MentorInterviewQuestionResponse setQuestionArchived(UUID mentorId, UUID questionId, boolean archived) {
        requireApprovedMentor(mentorId);
        MentorInterviewQuestion question = requireOwnedQuestion(mentorId, questionId);
        question.setArchived(archived);
        question.setUpdatedBy(mentorId);
        boolean saved = saveRepository.existsByMentorIdAndQuestionId(mentorId, questionId);
        return toResponse(questionRepository.save(question), saved, mentorId);
    }

    private MentorInterviewQuestion requireOwnedQuestion(UUID mentorId, UUID questionId) {
        return questionRepository.findByIdAndMentorId(questionId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Custom question not found"));
    }

    private GeneratedQuestion generateAiQuestion(String category, String difficulty, String topic) {
        String focus = topic == null || topic.isBlank()
            ? CATEGORY_LABELS.getOrDefault(category, "Engineering")
            : topic.trim();

        return switch (category) {
            case "dsa" -> generateDsa(focus, difficulty);
            case "system_design" -> generateSystemDesign(focus, difficulty);
            case "java" -> generateJava(focus, difficulty);
            case "react" -> generateReact(focus, difficulty);
            case "spring_boot" -> generateSpringBoot(focus, difficulty);
            case "hr" -> generateHr(focus, difficulty);
            default -> generateDsa(focus, difficulty);
        };
    }

    private GeneratedQuestion generateDsa(String focus, String difficulty) {
        return switch (difficulty) {
            case "easy" -> new GeneratedQuestion(
                "Given an array of integers, find two numbers that add up to a target. Optimize for " + focus + ".",
                "1. Can input contain duplicates?\n2. Are numbers sorted?\n3. What if no pair exists?",
                "Look for hash map usage, clear O(n) reasoning, and edge-case handling."
            );
            case "hard" -> new GeneratedQuestion(
                "Design a data structure for " + focus + " that supports insert, delete, and getRandom in O(1).",
                "1. How do you handle duplicates?\n2. Memory constraints?\n3. Thread safety?",
                "Expect trade-off discussion between arrays, hash maps, and linked structures."
            );
            default -> new GeneratedQuestion(
                "Explain time/space complexity for solving " + focus + " with a sliding window approach.",
                "1. When does sliding window fail?\n2. Compare with two-pointer technique.\n3. Real production example?",
                "Strong candidates articulate invariant maintenance and complexity proof."
            );
        };
    }

    private GeneratedQuestion generateSystemDesign(String focus, String difficulty) {
        return switch (difficulty) {
            case "easy" -> new GeneratedQuestion(
                "Design a rate limiter for " + focus + ". What algorithm would you choose and why?",
                "1. Per-user vs global limits?\n2. Distributed deployment?\n3. Burst traffic handling?",
                "Evaluate clarity of API design and failure-mode awareness."
            );
            case "medium" -> new GeneratedQuestion(
                "Design " + focus + " to handle 10K writes/sec with strong consistency requirements.",
                "1. Partition strategy?\n2. Caching layer?\n3. How to scale reads?",
                "Look for database selection rationale and observability plan."
            );
            default -> new GeneratedQuestion(
                "Design a globally distributed " + focus + " system like WhatsApp at billion-user scale.",
                "1. Message ordering guarantees?\n2. Multi-region failover?\n3. End-to-end encryption impact?",
                "Top answers cover CAP trade-offs, fan-out, and operational complexity."
            );
        };
    }

    private GeneratedQuestion generateJava(String focus, String difficulty) {
        return switch (difficulty) {
            case "easy" -> new GeneratedQuestion(
                "Explain the difference between == and equals() in Java, with examples related to " + focus + ".",
                "1. What happens with autoboxing?\n2. Override equals contract?\n3. hashCode implications?",
                "Check fundamentals and mention null-safe comparisons."
            );
            case "hard" -> new GeneratedQuestion(
                "Explain the Java Memory Model and how volatile/synchronized affect " + focus + " in concurrent code.",
                "1. Happens-before relationships?\n2. Double-checked locking pitfalls?\n3. Virtual threads impact?",
                "Expect happens-before examples and practical concurrency debugging."
            );
            default -> new GeneratedQuestion(
                "Compare HashMap vs ConcurrentHashMap for implementing " + focus + " in a multi-threaded service.",
                "1. Iteration safety?\n2. Size visibility?\n3. Performance under contention?",
                "Good answers include segment locking vs synchronized wrappers."
            );
        };
    }

    private GeneratedQuestion generateReact(String focus, String difficulty) {
        return switch (difficulty) {
            case "easy" -> new GeneratedQuestion(
                "Explain props vs state in React using a " + focus + " component example.",
                "1. When to lift state up?\n2. Controlled vs uncontrolled inputs?\n3. Re-render triggers?",
                "Assess component modeling basics and predictable data flow."
            );
            case "hard" -> new GeneratedQuestion(
                "How would you optimize rendering performance for a large " + focus + " dashboard in React?",
                "1. Virtualization strategy?\n2. Context vs state managers?\n3. Suspense and streaming?",
                "Expect memoization trade-offs and profiling workflow."
            );
            default -> new GeneratedQuestion(
                "When would you use useCallback vs useMemo while building " + focus + "? Provide concrete examples.",
                "1. Dependency array mistakes?\n2. Custom hook extraction?\n3. React Compiler implications?",
                "Look for understanding of referential stability, not blanket memoization."
            );
        };
    }

    private GeneratedQuestion generateSpringBoot(String focus, String difficulty) {
        return switch (difficulty) {
            case "easy" -> new GeneratedQuestion(
                "Explain Spring bean scopes and which scope fits a " + focus + " service component.",
                "1. Prototype vs singleton pitfalls?\n2. Request scope in async code?\n3. Testing implications?",
                "Check lifecycle awareness and dependency injection clarity."
            );
            case "hard" -> new GeneratedQuestion(
                "How would you implement distributed transactions for " + focus + " across microservices?",
                "1. Saga vs 2PC?\n2. Idempotency keys?\n3. Compensation workflows?",
                "Strong answers avoid 2PC defaults and discuss eventual consistency."
            );
            default -> new GeneratedQuestion(
                "Design REST APIs and validation strategy for a " + focus + " module in Spring Boot.",
                "1. Exception handling globally?\n2. DTO mapping approach?\n3. Security annotations?",
                "Evaluate layered architecture and production readiness."
            );
        };
    }

    private GeneratedQuestion generateHr(String focus, String difficulty) {
        int variant = ThreadLocalRandom.current().nextInt(3);
        return switch (variant) {
            case 0 -> new GeneratedQuestion(
                "Tell me about a time you failed while working on " + focus + ". What did you learn?",
                "1. What was your specific role?\n2. How did you communicate the failure?\n3. What changed afterward?",
                "Use STAR format; reward ownership and measurable improvement."
            );
            case 1 -> new GeneratedQuestion(
                "Describe your biggest technical achievement related to " + focus + " in the last two years.",
                "1. What was the business impact?\n2. Who did you collaborate with?\n3. What would you improve now?",
                "Look for impact metrics and humble retrospective."
            );
            default -> new GeneratedQuestion(
                "How do you handle disagreement with a teammate about " + focus + " architecture decisions?",
                "1. Example of conflict?\n2. Data used to decide?\n3. Outcome for the team?",
                "Assess collaboration, empathy, and decision-making maturity."
            );
        };
    }

    private MentorInterviewQuestionResponse toResponse(
        MentorInterviewQuestion question,
        boolean saved,
        UUID mentorId
    ) {
        boolean custom = question.getMentorId() != null && question.getMentorId().equals(mentorId);
        return new MentorInterviewQuestionResponse(
            question.getId(),
            question.getCategory(),
            CATEGORY_LABELS.getOrDefault(question.getCategory(), question.getCategory()),
            question.getDifficulty(),
            DIFFICULTY_LABELS.getOrDefault(question.getDifficulty(), question.getDifficulty()),
            question.getQuestionText(),
            question.getFollowUps(),
            question.getEvaluationHints(),
            question.isAiGenerated(),
            question.isTemplate(),
            custom,
            saved,
            DATE_FMT.format(question.getCreatedAt())
        );
    }

    private boolean matchesCategory(MentorInterviewQuestion q, String category) {
        return "all".equals(category) || q.getCategory().equals(category);
    }

    private boolean matchesDifficulty(MentorInterviewQuestion q, String difficulty) {
        return "all".equals(difficulty) || q.getDifficulty().equals(difficulty);
    }

    private boolean matchesView(
        MentorInterviewQuestion q,
        String view,
        Set<UUID> savedIds,
        UUID mentorId
    ) {
        return switch (view) {
            case "saved" -> savedIds.contains(q.getId());
            case "templates" -> q.isTemplate() && q.getMentorId() != null && q.getMentorId().equals(mentorId);
            case "ai" -> q.isAiGenerated() && q.getMentorId() != null && q.getMentorId().equals(mentorId);
            case "custom" -> q.getMentorId() != null && q.getMentorId().equals(mentorId);
            default -> true;
        };
    }

    private boolean matchesSearch(MentorInterviewQuestion q, String query) {
        if (query.isBlank()) {
            return true;
        }
        return q.getQuestionText().toLowerCase(Locale.ROOT).contains(query)
            || (q.getFollowUps() != null && q.getFollowUps().toLowerCase(Locale.ROOT).contains(query))
            || CATEGORY_LABELS.getOrDefault(q.getCategory(), "").toLowerCase(Locale.ROOT).contains(query);
    }

    private int difficultyOrder(String difficulty) {
        return switch (difficulty) {
            case "easy" -> 1;
            case "medium" -> 2;
            case "hard" -> 3;
            default -> 4;
        };
    }

    private void validateCategory(String category) {
        if (!CATEGORIES.contains(normalizeCategory(category))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category");
        }
    }

    private void validateDifficulty(String difficulty) {
        if (!DIFFICULTIES.contains(normalizeDifficulty(difficulty))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid difficulty");
        }
    }

    private String normalizeCategory(String category) {
        return category.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }

    private String normalizeDifficulty(String difficulty) {
        return difficulty.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void requireApprovedMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }
    }

    private record GeneratedQuestion(String questionText, String followUps, String evaluationHints) {}
}
