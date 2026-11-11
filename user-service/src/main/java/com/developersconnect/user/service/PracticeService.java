package com.developersconnect.user.service;

import com.developersconnect.user.dto.CodingProblemDtos.SubmitAttemptRequest;
import com.developersconnect.user.dto.PracticeDtos.PracticeAttemptResponse;
import com.developersconnect.user.dto.PracticeDtos.RunPracticeCodeRequest;
import com.developersconnect.user.dto.PracticeDtos.SavePracticeCodeRequest;
import com.developersconnect.user.dto.PracticeDtos.StartPracticeRequest;
import com.developersconnect.user.dto.PracticeDtos.SubmitPracticeRequest;
import com.developersconnect.user.dto.PracticeDtos.SubmitPracticeResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;
import com.developersconnect.user.model.CodingChallenge;
import com.developersconnect.user.model.PracticeAttempt;
import com.developersconnect.user.repository.PracticeAttemptRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PracticeService {

    private final PracticeAttemptRepository attemptRepository;
    private final CodingProblemService codingProblemService;
    private final PairCodeRunnerService codeRunnerService;
    private final UserStreakService userStreakService;

    public PracticeService(
        PracticeAttemptRepository attemptRepository,
        CodingProblemService codingProblemService,
        PairCodeRunnerService codeRunnerService,
        UserStreakService userStreakService
    ) {
        this.attemptRepository = attemptRepository;
        this.codingProblemService = codingProblemService;
        this.codeRunnerService = codeRunnerService;
        this.userStreakService = userStreakService;
    }

    @Transactional
    public PracticeAttemptResponse start(UUID studentId, StartPracticeRequest request) {
        UUID problemId = parseProblemId(request.problemId());
        CodingChallenge challenge = codingProblemService.requirePublishedProblem(problemId);
        String language = normalizeLanguage(request.language());

        PracticeAttempt existing = attemptRepository
            .findFirstByStudentIdAndProblemIdAndStatusOrderByStartedAtDesc(
                studentId, problemId, PracticeAttempt.STATUS_IN_PROGRESS
            )
            .orElse(null);

        if (existing != null) {
            if (existing.getCode() == null || existing.getCode().isBlank()) {
                existing.setCode(codingProblemService.starterCodeFor(challenge, language));
            }
            existing.setLanguage(language);
            return toResponse(attemptRepository.save(existing));
        }

        PracticeAttempt attempt = new PracticeAttempt();
        attempt.setStudentId(studentId);
        attempt.setProblemId(problemId);
        attempt.setLanguage(language);
        attempt.setCode(codingProblemService.starterCodeFor(challenge, language));
        attempt.setStatus(PracticeAttempt.STATUS_IN_PROGRESS);
        attempt.setMode(PracticeAttempt.MODE_SOLO);
        return toResponse(attemptRepository.save(attempt));
    }

    @Transactional
    public PracticeAttemptResponse saveCode(UUID attemptId, UUID studentId, SavePracticeCodeRequest request) {
        PracticeAttempt attempt = requireOwnedAttempt(attemptId, studentId);
        assertInProgress(attempt);
        attempt.setCode(request.code());
        attempt.setLanguage(normalizeLanguage(request.language()));
        return toResponse(attemptRepository.save(attempt));
    }

    @Transactional(readOnly = true)
    public RunPairCodeResponse runCode(UUID studentId, RunPracticeCodeRequest request) {
        UUID problemId = parseProblemId(request.problemId());
        codingProblemService.requirePublishedProblem(problemId);
        return codeRunnerService.run(request.code(), normalizeLanguage(request.language()), problemId.toString());
    }

    @Transactional
    public SubmitPracticeResponse submit(UUID attemptId, UUID studentId, SubmitPracticeRequest request) {
        PracticeAttempt attempt = requireOwnedAttempt(attemptId, studentId);
        assertInProgress(attempt);
        String language = normalizeLanguage(request.language());
        RunPairCodeResponse runResult = codeRunnerService.run(
            request.code(),
            language,
            attempt.getProblemId().toString()
        );

        attempt.setCode(request.code());
        attempt.setLanguage(language);
        attempt.setCompletedAt(Instant.now());
        attempt.setStatus(runResult.allPassed()
            ? PracticeAttempt.STATUS_COMPLETED
            : PracticeAttempt.STATUS_FAILED);
        PracticeAttempt saved = attemptRepository.save(attempt);
        userStreakService.recordActivity(studentId);

        if (runResult.allPassed()) {
            codingProblemService.recordAttempt(
                studentId,
                attempt.getProblemId(),
                new SubmitAttemptRequest(request.code(), language, true)
            );
        }

        return new SubmitPracticeResponse(toResponse(saved), runResult);
    }

    @Transactional(readOnly = true)
    public PracticeAttemptResponse getAttempt(UUID attemptId, UUID studentId) {
        return toResponse(requireOwnedAttempt(attemptId, studentId));
    }

    private PracticeAttempt requireOwnedAttempt(UUID attemptId, UUID studentId) {
        PracticeAttempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Practice session not found"));
        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your practice session");
        }
        return attempt;
    }

    private void assertInProgress(PracticeAttempt attempt) {
        if (!PracticeAttempt.STATUS_IN_PROGRESS.equals(attempt.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Practice session already ended");
        }
    }

    private UUID parseProblemId(String problemId) {
        if (problemId == null || problemId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Problem is required");
        }
        try {
            return UUID.fromString(problemId.trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid problem id");
        }
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) return "java";
        return language.trim().toLowerCase();
    }

    private PracticeAttemptResponse toResponse(PracticeAttempt attempt) {
        return new PracticeAttemptResponse(
            attempt.getId().toString(),
            attempt.getStudentId().toString(),
            attempt.getProblemId().toString(),
            attempt.getCode(),
            attempt.getLanguage(),
            attempt.getStatus(),
            attempt.getMode(),
            attempt.getStartedAt() != null ? attempt.getStartedAt().toString() : null,
            attempt.getCompletedAt() != null ? attempt.getCompletedAt().toString() : null
        );
    }
}
