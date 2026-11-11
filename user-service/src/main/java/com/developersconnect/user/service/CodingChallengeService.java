package com.developersconnect.user.service;

import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeDetailResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeStatsResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.ChallengeSummaryResponse;
import com.developersconnect.user.dto.CodingChallengeDtos.CreateChallengeRequest;
import com.developersconnect.user.dto.CodingProblemDtos.TestCaseDto;
import com.developersconnect.user.dto.CodingChallengeDtos.UpdateChallengeRequest;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.model.CodingChallengeSolve;
import com.developersconnect.user.repository.CodingChallengeRepository;
import com.developersconnect.user.repository.CodingChallengeSolveRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CodingChallengeService {

    public static final List<String> CATEGORIES = List.of(
        "DSA",
        "BACKEND_DEVELOPMENT",
        "FRONTEND_DEVELOPMENT",
        "DATABASE",
        "SYSTEM_DESIGN",
        "DEBUGGING"
    );

    private final CodingChallengeRepository challengeRepository;
    private final CodingChallengeSolveRepository solveRepository;
    private final ObjectMapper objectMapper;

    public CodingChallengeService(
        CodingChallengeRepository challengeRepository,
        CodingChallengeSolveRepository solveRepository,
        ObjectMapper objectMapper
    ) {
        this.challengeRepository = challengeRepository;
        this.solveRepository = solveRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ChallengeStatsResponse stats(UUID userId) {
        long total = challengeRepository.countByPublishedTrue();
        long solved = userId != null ? solveRepository.countByUserId(userId) : 0;
        return new ChallengeStatsResponse(total, solved);
    }

    @Transactional(readOnly = true)
    public List<ChallengeSummaryResponse> list(
        UUID userId,
        String language,
        String category,
        String difficulty,
        String company,
        String tag,
        String q,
        boolean includeUnpublished
    ) {
        Specification<CodingChallenge> spec = buildFilterSpec(
            language, category, difficulty, company, tag, q, includeUnpublished
        );
        List<CodingChallenge> challenges = challengeRepository.findAll(spec);
        Set<UUID> solvedIds = loadSolvedIds(userId, challenges);
        return challenges.stream()
            .map(c -> toSummary(c, solvedIds.contains(c.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public ChallengeDetailResponse getById(UUID id, UUID userId, boolean includeSolution) {
        CodingChallenge challenge = requireChallenge(id);
        if (!challenge.isPublished() && userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found");
        }
        boolean solved = userId != null
            && solveRepository.findByUserIdAndChallengeId(userId, id).isPresent();
        return toDetail(challenge, solved, includeSolution);
    }

    @Transactional(readOnly = true)
    public CodingChallenge requirePublishedChallenge(UUID id) {
        CodingChallenge challenge = requireChallenge(id);
        if (!challenge.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found");
        }
        return challenge;
    }

    @Transactional(readOnly = true)
    public String starterCodeFor(CodingChallenge challenge, String language) {
        Map<String, String> starter = readMap(challenge.getStarterCodeJson());
        String normalized = normalizeLanguage(language);
        if (starter.containsKey(normalized)) {
            return starter.get(normalized);
        }
        if (!starter.isEmpty()) {
            return starter.values().iterator().next();
        }
        return "// Start coding here\n";
    }

    @Transactional(readOnly = true)
    public List<TestCaseDto> testCasesFor(UUID challengeId) {
        CodingChallenge challenge = requireChallenge(challengeId);
        return readTestCases(challenge.getTestCasesJson());
    }

    @Transactional
    public ChallengeDetailResponse create(
        CreateChallengeRequest request,
        UUID createdBy,
        String creatorType
    ) {
        validateCreate(request);
        CodingChallenge challenge = new CodingChallenge();
        applyCreate(challenge, request, createdBy, creatorType);
        return toDetail(challengeRepository.save(challenge), false, true);
    }

    @Transactional
    public ChallengeDetailResponse update(UUID id, UpdateChallengeRequest request) {
        CodingChallenge challenge = requireChallenge(id);
        if (request.title() != null) challenge.setTitle(trim(request.title(), 200));
        if (request.description() != null) challenge.setDescription(trim(request.description(), 8000));
        if (request.difficulty() != null) challenge.setDifficulty(normalizeDifficulty(request.difficulty()));
        if (request.category() != null) challenge.setCategory(normalizeCategory(request.category()));
        if (request.languages() != null) challenge.setLanguagesJson(writeJson(normalizeLanguages(request.languages())));
        if (request.tags() != null) challenge.setTagsJson(writeJson(normalizeTags(request.tags())));
        if (request.companies() != null) challenge.setCompaniesJson(writeJson(normalizeTags(request.companies())));
        if (request.starterCode() != null) challenge.setStarterCodeJson(writeJson(request.starterCode()));
        if (request.testCases() != null) challenge.setTestCasesJson(writeJson(request.testCases()));
        if (request.solution() != null) challenge.setSolution(request.solution());
        if (request.published() != null) challenge.setPublished(request.published());
        challenge.setUpdatedAt(Instant.now());
        return toDetail(challengeRepository.save(challenge), false, true);
    }

    @Transactional
    public void delete(UUID id) {
        if (!challengeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found");
        }
        challengeRepository.deleteById(id);
    }

    @Transactional
    public void markSolved(UUID userId, UUID challengeId, String language) {
        if (solveRepository.findByUserIdAndChallengeId(userId, challengeId).isPresent()) {
            return;
        }
        CodingChallengeSolve solve = new CodingChallengeSolve();
        solve.setUserId(userId);
        solve.setChallengeId(challengeId);
        solve.setLanguage(normalizeLanguage(language));
        solveRepository.save(solve);
    }

    @Transactional(readOnly = true)
    public List<ChallengeDetailResponse> listByCreator(UUID createdBy) {
        return challengeRepository.findByCreatedByOrderByCreatedAtDesc(createdBy).stream()
            .map(c -> toDetail(c, false, true))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listCompanies() {
        return challengeRepository.findAll().stream()
            .filter(CodingChallenge::isPublished)
            .flatMap(c -> readList(c.getCompaniesJson()).stream())
            .distinct()
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listTags() {
        return challengeRepository.findAll().stream()
            .filter(CodingChallenge::isPublished)
            .flatMap(c -> readList(c.getTagsJson()).stream())
            .distinct()
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .toList();
    }

    private Specification<CodingChallenge> buildFilterSpec(
        String language,
        String category,
        String difficulty,
        String company,
        String tag,
        String q,
        boolean includeUnpublished
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!includeUnpublished) {
                predicates.add(cb.isTrue(root.get("published")));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("category")), normalizeCategory(category)));
            }
            if (difficulty != null && !difficulty.isBlank() && !"all".equalsIgnoreCase(difficulty)) {
                predicates.add(cb.equal(cb.lower(root.get("difficulty")), normalizeDifficulty(difficulty).toLowerCase(Locale.ROOT)));
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            if (language != null && !language.isBlank() && !"all".equalsIgnoreCase(language)) {
                String lang = normalizeLanguage(language);
                predicates.add(cb.like(cb.lower(root.get("languagesJson")), "%\"" + lang + "\"%"));
            }
            if (company != null && !company.isBlank() && !"all".equalsIgnoreCase(company)) {
                String needle = company.trim().toLowerCase(Locale.ROOT);
                predicates.add(cb.like(cb.lower(root.get("companiesJson")), "%\"" + needle + "\"%"));
            }
            if (tag != null && !tag.isBlank() && !"all".equalsIgnoreCase(tag)) {
                String needle = tag.trim().toLowerCase(Locale.ROOT);
                predicates.add(cb.like(cb.lower(root.get("tagsJson")), "%\"" + needle + "\"%"));
            }
            query.orderBy(cb.asc(root.get("title")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Set<UUID> loadSolvedIds(UUID userId, List<CodingChallenge> challenges) {
        if (userId == null || challenges.isEmpty()) {
            return Set.of();
        }
        List<UUID> ids = challenges.stream().map(CodingChallenge::getId).toList();
        return solveRepository.findByUserIdAndChallengeIdIn(userId, ids).stream()
            .map(CodingChallengeSolve::getChallengeId)
            .collect(Collectors.toSet());
    }

    private CodingChallenge requireChallenge(UUID id) {
        return challengeRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Challenge not found"));
    }

    private void validateCreate(CreateChallengeRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        if (request.starterCode() == null || request.starterCode().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Starter code is required");
        }
    }

    private void applyCreate(
        CodingChallenge challenge,
        CreateChallengeRequest request,
        UUID createdBy,
        String creatorType
    ) {
        challenge.setTitle(trim(request.title(), 200));
        challenge.setDescription(trim(request.description(), 8000));
        challenge.setDifficulty(normalizeDifficulty(request.difficulty()));
        challenge.setCategory(normalizeCategory(request.category()));
        challenge.setLanguagesJson(writeJson(normalizeLanguages(request.languages())));
        challenge.setTagsJson(writeJson(normalizeTags(request.tags())));
        challenge.setCompaniesJson(writeJson(normalizeTags(request.companies())));
        challenge.setStarterCodeJson(writeJson(request.starterCode()));
        challenge.setTestCasesJson(writeJson(request.testCases() != null ? request.testCases() : List.of()));
        challenge.setSolution(request.solution());
        challenge.setCreatedBy(createdBy);
        challenge.setCreatorType(creatorType != null ? creatorType : CodingChallenge.CREATOR_SYSTEM);
        challenge.setPublished(request.published() == null || request.published());
        Instant now = Instant.now();
        challenge.setCreatedAt(now);
        challenge.setUpdatedAt(now);
    }

    private ChallengeSummaryResponse toSummary(CodingChallenge c, boolean solved) {
        return new ChallengeSummaryResponse(
            c.getId().toString(),
            c.getTitle(),
            c.getDescription(),
            c.getDifficulty(),
            c.getCategory(),
            readList(c.getLanguagesJson()),
            readList(c.getTagsJson()),
            readList(c.getCompaniesJson()),
            solved,
            c.getCreatorType(),
            c.getCreatedAt().toString()
        );
    }

    private ChallengeDetailResponse toDetail(CodingChallenge c, boolean solved, boolean includeSolution) {
        return new ChallengeDetailResponse(
            c.getId().toString(),
            c.getTitle(),
            c.getDescription(),
            c.getDifficulty(),
            c.getCategory(),
            readList(c.getLanguagesJson()),
            readList(c.getTagsJson()),
            readList(c.getCompaniesJson()),
            readMap(c.getStarterCodeJson()),
            readTestCases(c.getTestCasesJson()),
            includeSolution ? c.getSolution() : null,
            solved,
            c.getCreatorType(),
            c.getCreatedAt().toString(),
            c.getUpdatedAt().toString()
        );
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Map<String, String> readMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private List<TestCaseDto> readTestCases(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<TestCaseDto>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value != null ? value : List.of());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize challenge data");
        }
    }

    private List<String> normalizeLanguages(List<String> languages) {
        if (languages == null || languages.isEmpty()) {
            return List.of("java");
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String lang : languages) {
            if (lang != null && !lang.isBlank()) {
                normalized.add(normalizeLanguage(lang));
            }
        }
        return normalized.isEmpty() ? List.of("java") : List.copyOf(normalized);
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream()
            .filter(t -> t != null && !t.isBlank())
            .map(t -> t.trim())
            .distinct()
            .toList();
    }

    private String normalizeLanguage(String language) {
        if (language == null) return "java";
        return language.toLowerCase(Locale.ROOT)
            .replace("nodejs", "javascript")
            .replace("react", "javascript")
            .replace("ts", "typescript");
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return "medium";
        return difficulty.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) return "DSA";
        String upper = category.trim().toUpperCase(Locale.ROOT)
            .replace('-', '_')
            .replace(' ', '_');
        if (upper.equals("BACKEND")) return "BACKEND_DEVELOPMENT";
        if (upper.equals("FRONTEND")) return "FRONTEND_DEVELOPMENT";
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
