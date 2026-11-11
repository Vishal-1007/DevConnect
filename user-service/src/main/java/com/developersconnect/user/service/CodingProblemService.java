package com.developersconnect.user.service;

import com.developersconnect.user.dto.CodingProblemDtos.AttemptResponse;
import com.developersconnect.user.dto.CodingProblemDtos.CreateProblemRequest;
import com.developersconnect.user.dto.CodingProblemDtos.ExampleDto;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemDetailResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemStatsResponse;
import com.developersconnect.user.dto.CodingProblemDtos.ProblemSummaryResponse;
import com.developersconnect.user.dto.CodingProblemDtos.SubmitAttemptRequest;
import com.developersconnect.user.dto.CodingProblemDtos.TestCaseDto;
import com.developersconnect.user.dto.CodingProblemDtos.UpdateProblemRequest;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.model.CodingChallengeSolve;
import com.developersconnect.user.model.ProblemAttempt;
import com.developersconnect.user.repository.CodingChallengeRepository;
import com.developersconnect.user.repository.CodingChallengeSolveRepository;
import com.developersconnect.user.repository.ProblemAttemptRepository;
import com.developersconnect.user.security.AuthPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CodingProblemService {

    public static final List<String> CATEGORIES = List.of(
        "DSA",
        "BACKEND_DEVELOPMENT",
        "FRONTEND_DEVELOPMENT",
        "DATABASE",
        "SYSTEM_DESIGN",
        "DEBUGGING"
    );

    private final CodingChallengeRepository problemRepository;
    private final CodingChallengeSolveRepository solveRepository;
    private final ProblemAttemptRepository attemptRepository;
    private final ObjectMapper objectMapper;
    private final UserStreakService userStreakService;

    public CodingProblemService(
        CodingChallengeRepository problemRepository,
        CodingChallengeSolveRepository solveRepository,
        ProblemAttemptRepository attemptRepository,
        ObjectMapper objectMapper,
        UserStreakService userStreakService
    ) {
        this.problemRepository = problemRepository;
        this.solveRepository = solveRepository;
        this.attemptRepository = attemptRepository;
        this.objectMapper = objectMapper;
        this.userStreakService = userStreakService;
    }

    public AuthPrincipal requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String roles = principal.roles();
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("ADMIN") && !upper.contains("MODERATOR")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return principal;
    }

    public AuthPrincipal requireMentor(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String roles = principal.roles();
        if (roles == null || roles.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        String upper = roles.toUpperCase(Locale.ROOT);
        if (!upper.contains("MENTOR") && !upper.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor access required");
        }
        return principal;
    }

    @Transactional(readOnly = true)
    public ProblemStatsResponse stats(UUID userId) {
        long total = problemRepository.countByStatus(CodingChallenge.STATUS_PUBLISHED);
        long solved = userId != null
            ? attemptRepository.countByStudentIdAndStatus(userId, ProblemAttempt.STATUS_PASSED)
            : 0;
        return new ProblemStatsResponse(total, solved);
    }

    @Transactional(readOnly = true)
    public List<ProblemSummaryResponse> listPublished(
        UUID userId, String language, String category, String difficulty,
        String company, String tag, String q
    ) {
        return listInternal(userId, language, category, difficulty, company, tag, q, CodingChallenge.STATUS_PUBLISHED, false);
    }

    @Transactional(readOnly = true)
    public List<ProblemDetailResponse> listAdmin(
        String language, String category, String difficulty,
        String company, String tag, String status, String q
    ) {
        Specification<CodingChallenge> spec = buildFilterSpec(
            language, category, difficulty, company, tag, q, status, true
        );
        return problemRepository.findAll(spec).stream()
            .map(p -> toDetail(p, false, true, true))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ProblemDetailResponse> listByCreator(UUID createdBy) {
        return problemRepository.findByCreatedByOrderByCreatedAtDesc(createdBy).stream()
            .map(p -> toDetail(p, false, true, true))
            .toList();
    }

    @Transactional(readOnly = true)
    public ProblemDetailResponse getById(UUID id, UUID userId, boolean includeSolution, boolean adminView) {
        CodingChallenge problem = requireProblem(id);
        if (!adminView && !CodingChallenge.STATUS_PUBLISHED.equals(problem.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        boolean solved = userId != null
            && attemptRepository.findFirstByStudentIdAndProblemIdAndStatusOrderBySubmittedAtDesc(
                userId, id, ProblemAttempt.STATUS_PASSED
            ).isPresent();
        return toDetail(problem, solved, includeSolution, adminView);
    }

    @Transactional(readOnly = true)
    public CodingChallenge requirePublishedProblem(UUID id) {
        CodingChallenge problem = requireProblem(id);
        if (!CodingChallenge.STATUS_PUBLISHED.equals(problem.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        return problem;
    }

    @Transactional(readOnly = true)
    public String starterCodeFor(CodingChallenge problem, String language) {
        Map<String, String> starter = readMap(problem.getStarterCodeJson());
        String normalized = normalizeLanguage(language);
        if (starter.containsKey(normalized)) return starter.get(normalized);
        if (!starter.isEmpty()) return starter.values().iterator().next();
        return "// Start coding here\n";
    }

    @Transactional(readOnly = true)
    public List<TestCaseDto> testCasesFor(UUID problemId) {
        return readTestCases(requireProblem(problemId).getTestCasesJson());
    }

    @Transactional
    public ProblemDetailResponse create(CreateProblemRequest request, UUID createdBy, boolean isAdmin) {
        validateForSave(request.status(), request, true);
        CodingChallenge problem = new CodingChallenge();
        applyRequest(problem, request, createdBy, isAdmin ? CodingChallenge.CREATOR_ADMIN : CodingChallenge.CREATOR_MENTOR);
        return toDetail(problemRepository.save(problem), false, true, true);
    }

    @Transactional
    public ProblemDetailResponse update(UUID id, UpdateProblemRequest request, boolean isAdmin) {
        CodingChallenge problem = requireProblem(id);
        if (!isAdmin && !CodingChallenge.CREATOR_MENTOR.equals(problem.getCreatorType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to edit this problem");
        }
        if (request.title() != null) problem.setTitle(trim(request.title(), 200));
        if (request.description() != null) problem.setDescription(trim(request.description(), 12000));
        if (request.difficulty() != null) problem.setDifficulty(normalizeDifficulty(request.difficulty()));
        if (request.category() != null) problem.setCategory(normalizeCategory(request.category()));
        if (request.languages() != null) problem.setLanguagesJson(writeJson(normalizeLanguages(request.languages())));
        if (request.tags() != null) problem.setTagsJson(writeJson(normalizeTags(request.tags())));
        if (request.companies() != null) problem.setCompaniesJson(writeJson(normalizeTags(request.companies())));
        if (request.starterCode() != null) problem.setStarterCodeJson(writeJson(request.starterCode()));
        if (request.testCases() != null) problem.setTestCasesJson(writeJson(request.testCases()));
        if (request.solution() != null) problem.setSolution(request.solution());
        if (request.hints() != null) problem.setHintsJson(writeJson(request.hints()));
        if (request.constraints() != null) problem.setConstraintsJson(writeJson(request.constraints()));
        if (request.examples() != null) problem.setExamplesJson(writeJson(request.examples()));
        if (request.status() != null) {
            validateForSave(request.status(), toCreateRequest(request), false);
            problem.setStatus(normalizeStatus(request.status(), isAdmin));
        }
        problem.setUpdatedAt(Instant.now());
        return toDetail(problemRepository.save(problem), false, true, true);
    }

    @Transactional
    public ProblemDetailResponse updateStatus(UUID id, String status, boolean isAdmin) {
        if (!isAdmin) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        CodingChallenge problem = requireProblem(id);
        problem.setStatus(normalizeStatus(status, true));
        problem.setUpdatedAt(Instant.now());
        return toDetail(problemRepository.save(problem), false, true, true);
    }

    @Transactional
    public void delete(UUID id, boolean isAdmin) {
        if (!isAdmin) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        if (!problemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found");
        }
        problemRepository.deleteById(id);
    }

    @Transactional
    public AttemptResponse recordAttempt(UUID studentId, UUID problemId, SubmitAttemptRequest request) {
        requirePublishedProblem(problemId);
        ProblemAttempt attempt = new ProblemAttempt();
        attempt.setStudentId(studentId);
        attempt.setProblemId(problemId);
        attempt.setCode(request.code());
        attempt.setLanguage(normalizeLanguage(request.language()));
        attempt.setStatus(request.passed() ? ProblemAttempt.STATUS_PASSED : ProblemAttempt.STATUS_FAILED);
        ProblemAttempt saved = attemptRepository.save(attempt);
        userStreakService.recordActivity(studentId);
        if (request.passed()) {
            markSolved(studentId, problemId, request.language());
        }
        return new AttemptResponse(
            saved.getId().toString(),
            saved.getProblemId().toString(),
            saved.getStatus(),
            saved.getLanguage(),
            saved.getSubmittedAt().toString()
        );
    }

    @Transactional
    public void markSolved(UUID userId, UUID problemId, String language) {
        if (solveRepository.findByUserIdAndChallengeId(userId, problemId).isPresent()) return;
        CodingChallengeSolve solve = new CodingChallengeSolve();
        solve.setUserId(userId);
        solve.setChallengeId(problemId);
        solve.setLanguage(normalizeLanguage(language));
        solveRepository.save(solve);
    }

    @Transactional(readOnly = true)
    public List<String> listCompanies() {
        return problemRepository.findAll().stream()
            .filter(p -> CodingChallenge.STATUS_PUBLISHED.equals(p.getStatus()))
            .flatMap(p -> readList(p.getCompaniesJson()).stream())
            .distinct().sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    @Transactional(readOnly = true)
    public List<String> listTags() {
        return problemRepository.findAll().stream()
            .filter(p -> CodingChallenge.STATUS_PUBLISHED.equals(p.getStatus()))
            .flatMap(p -> readList(p.getTagsJson()).stream())
            .distinct().sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }

    private List<ProblemSummaryResponse> listInternal(
        UUID userId, String language, String category, String difficulty,
        String company, String tag, String q, String requiredStatus, boolean includeAllStatuses
    ) {
        Specification<CodingChallenge> spec = buildFilterSpec(
            language, category, difficulty, company, tag, q,
            includeAllStatuses ? null : requiredStatus, includeAllStatuses
        );
        List<CodingChallenge> problems = problemRepository.findAll(spec);
        Set<UUID> solvedIds = loadSolvedIds(userId, problems);
        return problems.stream()
            .map(p -> toSummary(p, solvedIds.contains(p.getId())))
            .toList();
    }

    private Specification<CodingChallenge> buildFilterSpec(
        String language, String category, String difficulty, String company,
        String tag, String q, String status, boolean includeAllStatuses
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!includeAllStatuses) {
                predicates.add(cb.equal(root.get("status"), CodingChallenge.STATUS_PUBLISHED));
            } else if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase(Locale.ROOT)));
            }
            if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                predicates.add(cb.equal(cb.upper(root.get("category")), normalizeCategory(category)));
            }
            if (difficulty != null && !difficulty.isBlank() && !"all".equalsIgnoreCase(difficulty)) {
                predicates.add(cb.equal(cb.lower(root.get("difficulty")), normalizeDifficulty(difficulty).toLowerCase(Locale.ROOT)));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("tagsJson")), pattern),
                    cb.like(cb.lower(root.get("companiesJson")), pattern)
                ));
            }
            if (language != null && !language.isBlank() && !"all".equalsIgnoreCase(language)) {
                String lang = normalizeLanguage(language);
                predicates.add(cb.like(cb.lower(root.get("languagesJson")), "%\"" + lang + "\"%"));
            }
            if (company != null && !company.isBlank() && !"all".equalsIgnoreCase(company)) {
                predicates.add(cb.like(cb.lower(root.get("companiesJson")), "%\"" + company.trim().toLowerCase(Locale.ROOT) + "\"%"));
            }
            if (tag != null && !tag.isBlank() && !"all".equalsIgnoreCase(tag)) {
                predicates.add(cb.like(cb.lower(root.get("tagsJson")), "%\"" + tag.trim().toLowerCase(Locale.ROOT) + "\"%"));
            }
            query.orderBy(cb.asc(root.get("title")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void validateForSave(String status, CreateProblemRequest request, boolean creating) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        if (request.category() == null || request.category().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
        }
        if (request.difficulty() == null || request.difficulty().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Difficulty is required");
        }
        if (request.languages() == null || request.languages().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one language is required");
        }
        if (request.starterCode() == null || request.starterCode().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Starter code is required");
        }
        if (CodingChallenge.STATUS_PUBLISHED.equals(normalizeStatus(status, true))) {
            if (request.testCases() == null || request.testCases().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one test case is required to publish");
            }
        }
    }

    private void applyRequest(CodingChallenge problem, CreateProblemRequest request, UUID createdBy, String creatorType) {
        problem.setTitle(trim(request.title(), 200));
        problem.setDescription(trim(request.description(), 12000));
        problem.setDifficulty(normalizeDifficulty(request.difficulty()));
        problem.setCategory(normalizeCategory(request.category()));
        problem.setLanguagesJson(writeJson(normalizeLanguages(request.languages())));
        problem.setTagsJson(writeJson(normalizeTags(request.tags())));
        problem.setCompaniesJson(writeJson(normalizeTags(request.companies())));
        problem.setStarterCodeJson(writeJson(request.starterCode()));
        problem.setTestCasesJson(writeJson(request.testCases() != null ? request.testCases() : List.of()));
        problem.setSolution(request.solution());
        problem.setHintsJson(writeJson(request.hints() != null ? request.hints() : List.of()));
        problem.setConstraintsJson(writeJson(request.constraints() != null ? request.constraints() : List.of()));
        problem.setExamplesJson(writeJson(request.examples() != null ? request.examples() : List.of()));
        problem.setCreatedBy(createdBy);
        problem.setCreatorType(creatorType);
        boolean admin = CodingChallenge.CREATOR_ADMIN.equals(creatorType);
        problem.setStatus(normalizeStatus(request.status(), admin));
        Instant now = Instant.now();
        problem.setCreatedAt(now);
        problem.setUpdatedAt(now);
    }

    private CreateProblemRequest toCreateRequest(UpdateProblemRequest request) {
        return new CreateProblemRequest(
            request.title(), request.description(), request.category(), request.difficulty(),
            request.languages(), request.tags(), request.companies(), request.starterCode(),
            request.testCases(), request.solution(), request.hints(), request.constraints(),
            request.examples(), request.status()
        );
    }

    private ProblemSummaryResponse toSummary(CodingChallenge p, boolean solved) {
        return new ProblemSummaryResponse(
            p.getId().toString(), p.getTitle(), p.getDescription(), p.getDifficulty(), p.getCategory(),
            readList(p.getLanguagesJson()), readList(p.getTagsJson()), readList(p.getCompaniesJson()),
            readExamples(p.getExamplesJson()), readList(p.getConstraintsJson()),
            solved, solvedCount(p.getId()), p.getStatus(), p.getCreatorType(), p.getCreatedAt().toString()
        );
    }

    private ProblemDetailResponse toDetail(CodingChallenge p, boolean solved, boolean includeSolution, boolean adminView) {
        return new ProblemDetailResponse(
            p.getId().toString(), p.getTitle(), p.getDescription(), p.getDifficulty(), p.getCategory(),
            readList(p.getLanguagesJson()), readList(p.getTagsJson()), readList(p.getCompaniesJson()),
            readExamples(p.getExamplesJson()), readList(p.getConstraintsJson()), readList(p.getHintsJson()),
            readMap(p.getStarterCodeJson()), readTestCases(p.getTestCasesJson()),
            includeSolution ? p.getSolution() : null,
            solved, solvedCount(p.getId()), p.getStatus(), p.getCreatorType(),
            p.getCreatedAt().toString(), p.getUpdatedAt().toString()
        );
    }

    private long solvedCount(UUID problemId) {
        return attemptRepository.countDistinctStudentsByProblemIdAndStatus(problemId, ProblemAttempt.STATUS_PASSED);
    }

    private Set<UUID> loadSolvedIds(UUID userId, List<CodingChallenge> problems) {
        if (userId == null || problems.isEmpty()) return Set.of();
        List<UUID> ids = problems.stream().map(CodingChallenge::getId).toList();
        return attemptRepository.findByStudentIdAndProblemIdIn(userId, ids).stream()
            .filter(a -> ProblemAttempt.STATUS_PASSED.equals(a.getStatus()))
            .map(ProblemAttempt::getProblemId)
            .collect(Collectors.toSet());
    }

    private CodingChallenge requireProblem(UUID id) {
        return problemRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
    }

    private String normalizeStatus(String status, boolean isAdmin) {
        if (status == null || status.isBlank()) return CodingChallenge.STATUS_DRAFT;
        String upper = status.trim().toUpperCase(Locale.ROOT);
        if (CodingChallenge.STATUS_PUBLISHED.equals(upper)) return CodingChallenge.STATUS_PUBLISHED;
        if (CodingChallenge.STATUS_DRAFT.equals(upper)) return CodingChallenge.STATUS_DRAFT;
        if (CodingChallenge.STATUS_PENDING_APPROVAL.equals(upper)) {
            return isAdmin ? CodingChallenge.STATUS_PUBLISHED : CodingChallenge.STATUS_PENDING_APPROVAL;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception ex) { return List.of(); }
    }

    private List<ExampleDto> readExamples(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<ExampleDto>>() {}); }
        catch (Exception ex) { return List.of(); }
    }

    private Map<String, String> readMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {}); }
        catch (Exception ex) { return Map.of(); }
    }

    private List<TestCaseDto> readTestCases(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<TestCaseDto>>() {}); }
        catch (Exception ex) { return List.of(); }
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value != null ? value : List.of()); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize data"); }
    }

    private List<String> normalizeLanguages(List<String> languages) {
        if (languages == null || languages.isEmpty()) return List.of("java");
        Set<String> normalized = new LinkedHashSet<>();
        for (String lang : languages) {
            if (lang != null && !lang.isBlank()) normalized.add(normalizeLanguage(lang));
        }
        return normalized.isEmpty() ? List.of("java") : List.copyOf(normalized);
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream().filter(t -> t != null && !t.isBlank()).map(String::trim).distinct().toList();
    }

    public String normalizeLanguage(String language) {
        if (language == null) return "java";
        return language.toLowerCase(Locale.ROOT)
            .replace("nodejs", "javascript").replace("react", "javascript")
            .replace("c++", "cpp").replace("golang", "go");
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return "medium";
        return difficulty.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) return "DSA";
        String upper = category.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (upper.equals("BACKEND") || upper.equals("BACKEND_DEVELOPMENT")) return "BACKEND_DEVELOPMENT";
        if (upper.equals("FRONTEND") || upper.equals("FRONTEND_DEVELOPMENT")) return "FRONTEND_DEVELOPMENT";
        if (!CATEGORIES.contains(upper)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category: " + category);
        }
        return upper;
    }

    private String trim(String value, int maxLen) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen);
    }
}
