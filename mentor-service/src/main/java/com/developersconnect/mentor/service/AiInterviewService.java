package com.developersconnect.mentor.service;



import com.developersconnect.mentor.dto.AiInterviewDtos.InterviewResultResponse;

import com.developersconnect.mentor.dto.AiInterviewDtos.InterviewSessionResponse;

import com.developersconnect.mentor.dto.AiInterviewDtos.QuestionResponse;

import com.developersconnect.mentor.dto.AiInterviewDtos.ResumeParseResponse;

import com.developersconnect.mentor.dto.AiInterviewDtos.StartInterviewRequest;

import com.developersconnect.mentor.model.AiInterview;

import com.developersconnect.mentor.model.AiInterviewQuestion;

import com.developersconnect.mentor.repository.AiInterviewQuestionRepository;

import com.developersconnect.mentor.repository.AiInterviewRepository;

import com.developersconnect.mentor.service.ai.AdaptiveQuestionComposer;

import com.developersconnect.mentor.service.ai.DifficultyManagerService;

import com.developersconnect.mentor.service.ai.InterviewCandidateContext;

import com.developersconnect.mentor.service.ai.InterviewEvaluationResult;

import com.developersconnect.mentor.service.ai.InterviewEvaluationService;

import com.developersconnect.mentor.service.ai.InterviewMemoryContext;

import com.developersconnect.mentor.service.ai.InterviewMemoryService;

import com.developersconnect.mentor.service.ai.InterviewPromptBuilder;

import com.developersconnect.mentor.service.ai.InterviewQuestionGeneratorService;

import com.developersconnect.mentor.service.ai.ResumeAnalyzerService;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Path;

import java.time.Instant;

import java.util.ArrayList;

import java.util.Arrays;

import java.util.List;

import java.util.UUID;

import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import org.springframework.web.server.ResponseStatusException;



@Service

public class AiInterviewService {



    private static final int MAX_QUESTIONS = 10;

    private static final String SILENCE_TRANSITION = "Let's continue with the next question.";



    private final AiInterviewRepository interviewRepo;

    private final AiInterviewQuestionRepository questionRepo;

    private final ResumeParserService resumeParser;

    private final OllamaService ollama;

    private final StreamMediaStorageService storage;

    private final ObjectMapper objectMapper;

    private final ResumeAnalyzerService resumeAnalyzer;

    private final InterviewPromptBuilder promptBuilder;

    private final InterviewEvaluationService evaluationService;

    private final DifficultyManagerService difficultyManager;

    private final InterviewQuestionGeneratorService questionGenerator;

    private final InterviewMemoryService memoryService;



    public AiInterviewService(

        AiInterviewRepository interviewRepo,

        AiInterviewQuestionRepository questionRepo,

        ResumeParserService resumeParser,

        OllamaService ollama,

        StreamMediaStorageService storage,

        ObjectMapper objectMapper,

        ResumeAnalyzerService resumeAnalyzer,

        InterviewPromptBuilder promptBuilder,

        InterviewEvaluationService evaluationService,

        DifficultyManagerService difficultyManager,

        InterviewQuestionGeneratorService questionGenerator,

        InterviewMemoryService memoryService

    ) {

        this.interviewRepo = interviewRepo;

        this.questionRepo = questionRepo;

        this.resumeParser = resumeParser;

        this.ollama = ollama;

        this.storage = storage;

        this.objectMapper = objectMapper;

        this.resumeAnalyzer = resumeAnalyzer;

        this.promptBuilder = promptBuilder;

        this.evaluationService = evaluationService;

        this.difficultyManager = difficultyManager;

        this.questionGenerator = questionGenerator;

        this.memoryService = memoryService;

    }



    public ResumeParseResponse uploadResume(UUID userId, MultipartFile file) {

        String stored = storage.storeResume(file);

        Path path = storage.resolveStoredPath(stored);

        return resumeParser.parse(path, file.getOriginalFilename());

    }



    public com.developersconnect.mentor.dto.AiInterviewDtos.UploadResumeResponse uploadResumeWithUrl(

        UUID userId, MultipartFile file

    ) {

        String stored = storage.storeResume(file);

        Path path = storage.resolveStoredPath(stored);

        ResumeParseResponse parsed = resumeParser.parse(path, file.getOriginalFilename());

        return new com.developersconnect.mentor.dto.AiInterviewDtos.UploadResumeResponse(

            "/uploads/" + stored,

            parsed.username(),

            parsed.skills(),

            parsed.experience(),

            parsed.projects(),

            parsed.companies(),

            parsed.technologies(),

            parsed.education()

        );

    }



    @Transactional

    public InterviewSessionResponse startInterview(UUID userId, StartInterviewRequest req) {

        ResumeParseResponse resume = req.resumeData() != null

            ? req.resumeData()

            : resumeParser.fromJson("{}");



        String candidateName = firstNonBlank(req.candidateName(), resume.username());

        if (candidateName.isBlank()) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Candidate name is required");

        }



        int initialDifficulty = difficultyManager.initialLevel(req.experienceLevel());

        InterviewMemoryContext initialMemory = InterviewMemoryContext.empty(

            resume.skills(), resume.projects(), resume.technologies()

        ).withDifficulty(difficultyLabel(initialDifficulty));



        AiInterview interview = new AiInterview();

        interview.setUserId(userId);

        interview.setResumeUrl(req.resumeUrl());

        interview.setCandidateName(candidateName);

        interview.setTargetRole(req.targetRole());

        interview.setExperienceLevel(req.experienceLevel());

        interview.setInterviewType(req.interviewType());

        interview.setResumeData(resumeParser.toJson(resume));

        interview.setStatus(AiInterview.Status.IN_PROGRESS);

        interview.setQuestionCount(0);

        interview.setDifficultyLevel(initialDifficulty);

        interview.setCurrentScore(0);

        interview.setContextJson(memoryService.serialize(initialMemory));



        String intro = ollama.generate(

            promptBuilder.buildIntroPrompt(

                candidateName,

                req.targetRole(),

                req.interviewType(),

                resumeAnalyzer.buildSummary(resume)

            )

        );

        if (intro.isBlank()) {

            intro = buildFallbackIntro(candidateName, req.targetRole(), resume);

        }

        interview.setIntroMessage(intro);

        interviewRepo.save(interview);



        InterviewCandidateContext context = resumeAnalyzer.buildContext(

            interview, resume, List.of(), 1, MAX_QUESTIONS

        );

        AdaptiveQuestionComposer.GeneratedQuestion first = questionGenerator.generateNextQuestion(

            context, initialMemory, List.of(), null, ""

        );

        String questionType = promptBuilder.resolveQuestionType(context);

        AiInterviewQuestion q = saveQuestion(

            interview.getId(), 1, first.question(), questionType, first.topic(), first.difficulty(), null

        );

        interview.setQuestionCount(1);

        interviewRepo.save(interview);



        return toSessionResponse(interview, q, false, null, null, null, null, List.of(q.getQuestion()));

    }



    @Transactional

    public InterviewSessionResponse submitAnswer(

        UUID userId,

        UUID interviewId,

        String answer,

        UUID questionId,

        Integer answerTimeSeconds

    ) {

        AiInterview interview = requireInterview(userId, interviewId);

        if (interview.getStatus() == AiInterview.Status.COMPLETED) {

            return toSessionResponse(interview, null, true, buildResult(interview), null, null, null, loadAskedQuestions(interviewId));

        }



        List<AiInterviewQuestion> questions = questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interviewId);

        AiInterviewQuestion current = questions.stream()

            .filter(q -> q.getScore() == null)

            .findFirst()

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No pending question"));



        if (questionId != null && !questionId.equals(current.getId())) {

            throw new ResponseStatusException(HttpStatus.CONFLICT, "This question was already answered. Please refresh.");

        }



        ResumeParseResponse resume = resumeParser.fromJson(interview.getResumeData());

        String trimmedAnswer = answer != null ? answer.trim() : "";

        boolean silent = trimmedAnswer.isBlank();



        InterviewEvaluationResult eval;

        if (silent) {

            eval = InterviewEvaluationService.silentAnswerResult();

        } else {

            InterviewMemoryContext memoryBefore = memoryService.build(interview, resume, questions);

            InterviewCandidateContext evalContext = resumeAnalyzer.buildContext(

                interview, resume, questions, current.getQuestionOrder(), MAX_QUESTIONS

            );

            eval = evaluationService.evaluate(

                evalContext,

                memoryBefore,

                current.getQuestion(),

                trimmedAnswer,

                current.getQuestionType() != null ? current.getQuestionType() : "TECHNICAL"

            );

        }



        current.setUserAnswer(silent ? "" : trimmedAnswer);

        current.setScore(eval.totalScore());

        current.setTechnicalScore(eval.technicalAccuracy());

        current.setCommunicationScore(eval.communication());

        current.setGrammarScore(eval.grammar());

        current.setConfidenceScore(eval.confidence());

        current.setAiFeedback(eval.feedbackSummary());

        current.setFeedbackJson(toJson(eval));

        if (answerTimeSeconds != null) {

            current.setAnswerTimeSeconds(answerTimeSeconds);

        } else if (silent) {

            current.setAnswerTimeSeconds(0);

        }

        questionRepo.save(current);



        int newDifficulty = difficultyManager.adjustAfterAnswer(

            interview.getDifficultyLevel() != null ? interview.getDifficultyLevel() : 2,

            eval.totalScore()

        );

        interview.setDifficultyLevel(newDifficulty);



        List<AiInterviewQuestion> updatedQuestions = questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interviewId);

        InterviewMemoryContext memory = memoryService.build(interview, resume, updatedQuestions);

        memory = memory.withDifficulty(difficultyLabel(newDifficulty));

        interview.setContextJson(memoryService.serialize(memory));

        interview.setCurrentScore(averageAnswerScore(updatedQuestions));

        interviewRepo.save(interview);



        String transitionMessage = silent ? SILENCE_TRANSITION : null;

        int answeredCount = current.getQuestionOrder();



        if (answeredCount >= MAX_QUESTIONS) {

            return completeInterview(interview, eval.feedbackSummary(), eval.totalScore(), transitionMessage);

        }



        InterviewCandidateContext nextContext = resumeAnalyzer.buildContext(

            interview, resume, updatedQuestions, answeredCount + 1, MAX_QUESTIONS

        );

        AdaptiveQuestionComposer.GeneratedQuestion nextGenerated = silent
            ? questionGenerator.generateNextQuestionFast(
                nextContext,
                memory,
                updatedQuestions,
                current.getQuestion(),
                trimmedAnswer
            )
            : questionGenerator.generateNextQuestion(
                nextContext,
                memory,
                updatedQuestions,
                current.getQuestion(),
                trimmedAnswer
            );

        String nextType = promptBuilder.resolveQuestionType(nextContext);

        AiInterviewQuestion next = saveQuestion(

            interviewId,

            answeredCount + 1,

            nextGenerated.question(),

            nextType,

            nextGenerated.topic(),

            nextGenerated.difficulty(),

            null

        );

        interview.setQuestionCount(answeredCount + 1);

        interviewRepo.save(interview);

        questionRepo.flush();

        return toSessionResponse(

            interview,

            next,

            false,

            null,

            eval.feedbackSummary(),

            eval.totalScore(),

            transitionMessage,

            loadAskedQuestions(interviewId)

        );

    }



    @Transactional

    public InterviewSessionResponse submitAnswer(UUID userId, UUID interviewId, String answer) {

        return submitAnswer(userId, interviewId, answer, null, null);

    }



    @Transactional

    public InterviewSessionResponse endInterview(UUID userId, UUID interviewId) {

        AiInterview interview = requireInterview(userId, interviewId);

        if (interview.getStatus() == AiInterview.Status.COMPLETED) {

            return toSessionResponse(interview, null, true, buildResult(interview), null, null, null, loadAskedQuestions(interviewId));

        }

        return completeInterview(interview, null, null, null);

    }



    public InterviewSessionResponse getSession(UUID userId, UUID interviewId) {

        AiInterview interview = requireInterview(userId, interviewId);

        if (interview.getStatus() == AiInterview.Status.COMPLETED) {

            return toSessionResponse(interview, null, true, buildResult(interview), null, null, null, loadAskedQuestions(interviewId));

        }

        List<AiInterviewQuestion> questions = questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interviewId);

        AiInterviewQuestion pending = questions.stream()

            .filter(q -> q.getScore() == null)

            .findFirst()

            .orElse(null);

        return toSessionResponse(interview, pending, false, null, null, null, null, loadAskedQuestions(interviewId));

    }



    public InterviewResultResponse getResult(UUID userId, UUID interviewId) {

        AiInterview interview = requireInterview(userId, interviewId);

        if (interview.getStatus() != AiInterview.Status.COMPLETED) {

            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview not completed yet");

        }

        return buildResult(interview);

    }



    private InterviewSessionResponse completeInterview(

        AiInterview interview,

        String lastFeedback,

        Integer lastScore,

        String transitionMessage

    ) {

        List<AiInterviewQuestion> questions = questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interview.getId());

        AggregatedScores scores = aggregateScores(questions);



        interview.setStatus(AiInterview.Status.COMPLETED);

        interview.setCompletedAt(Instant.now());

        interview.setScore(scores.overall());

        interview.setTechnicalScore(scores.technical());

        interview.setCommunicationScore(scores.communication());

        interview.setProblemSolvingScore(scores.problemSolving());

        interview.setConfidenceScore(scores.confidence());

        interview.setGrammarScore(scores.grammar());

        interview.setStrengths(String.join("|", scores.strengths()));

        interview.setImprovements(String.join("|", scores.improvements()));

        interview.setRecommendedTopics(String.join("|", scores.weakAreas()));

        interviewRepo.save(interview);



        return toSessionResponse(

            interview, null, true, buildResult(interview), lastFeedback, lastScore, transitionMessage,

            loadAskedQuestions(interview.getId())

        );

    }



    private AggregatedScores aggregateScores(List<AiInterviewQuestion> questions) {

        List<AiInterviewQuestion> answered = questions.stream()

            .filter(q -> q.getScore() != null)

            .toList();

        if (answered.isEmpty()) {

            return new AggregatedScores(0, 0, 0, 0, 0, 0,

                List.of(), List.of("Practice structured technical answers"), List.of("Core skills"));

        }



        double avg = answered.stream().mapToInt(AiInterviewQuestion::getScore).average().orElse(0);

        int overall = (int) Math.round(avg);

        int technical = avgComponent(answered, AiInterviewQuestion::getTechnicalScore);

        int communication = avgComponent(answered, AiInterviewQuestion::getCommunicationScore);

        int grammar = avgComponent(answered, AiInterviewQuestion::getGrammarScore);

        int confidence = avgComponent(answered, AiInterviewQuestion::getConfidenceScore);

        int problemSolving = Math.min(100, (technical + overall) / 2);



        List<String> strengths = new ArrayList<>();

        List<String> improvements = new ArrayList<>();

        List<String> weakAreas = new ArrayList<>();

        for (AiInterviewQuestion q : answered) {

            parseFeedbackLists(q, strengths, improvements, weakAreas);

            if (q.getScore() != null && q.getScore() < 40 && q.getTopic() != null) {

                weakAreas.add(q.getTopic());

            }

            if (q.getScore() != null && q.getScore() >= 65 && q.getTopic() != null) {

                strengths.add(q.getTopic());

            }

        }

        if (strengths.isEmpty() && overall >= 50) strengths.add("Completed the interview");

        if (improvements.isEmpty()) improvements.add("Deepen technical explanations with production examples");

        if (weakAreas.isEmpty()) weakAreas.addAll(List.of("System Design", "Architecture", "Communication"));



        return new AggregatedScores(

            overall, technical, communication, problemSolving, confidence, grammar,

            strengths.stream().distinct().limit(5).toList(),

            improvements.stream().distinct().limit(5).toList(),

            weakAreas.stream().distinct().limit(6).toList()

        );

    }



    private void parseFeedbackLists(

        AiInterviewQuestion q,

        List<String> strengths,

        List<String> improvements,

        List<String> weakAreas

    ) {

        if (q.getFeedbackJson() == null) return;

        try {

            InterviewEvaluationResult eval = objectMapper.readValue(q.getFeedbackJson(), InterviewEvaluationResult.class);

            strengths.addAll(eval.strengths());

            improvements.addAll(eval.improvements());

            weakAreas.addAll(eval.mistakes());

        } catch (Exception ignored) {

            /* skip malformed */

        }

    }



    private int avgComponent(List<AiInterviewQuestion> questions, java.util.function.Function<AiInterviewQuestion, Integer> getter) {

        return (int) Math.round(questions.stream()

            .map(getter)

            .filter(v -> v != null)

            .mapToInt(Integer::intValue)

            .average()

            .orElse(0));

    }



    private int averageAnswerScore(List<AiInterviewQuestion> questions) {

        List<AiInterviewQuestion> answered = questions.stream()

            .filter(q -> q.getScore() != null)

            .toList();

        if (answered.isEmpty()) return 0;

        return (int) Math.round(answered.stream().mapToInt(q -> q.getScore() != null ? q.getScore() : 0).average().orElse(0));

    }



    private AiInterviewQuestion saveQuestion(

        UUID interviewId,

        int order,

        String text,

        String questionType,

        String topic,

        String difficulty,

        Integer answerTimeSeconds

    ) {

        AiInterviewQuestion q = new AiInterviewQuestion();

        q.setInterviewId(interviewId);

        q.setQuestionOrder(order);

        q.setQuestion(questionGenerator.cleanQuestion(text));

        q.setQuestionType(questionType);

        q.setTopic(topic);

        q.setDifficulty(difficulty);

        q.setAnswerTimeSeconds(answerTimeSeconds);

        return questionRepo.save(q);

    }



    private List<String> loadAskedQuestions(UUID interviewId) {

        return questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interviewId).stream()

            .map(AiInterviewQuestion::getQuestion)

            .toList();

    }



    private InterviewSessionResponse toSessionResponse(

        AiInterview interview,

        AiInterviewQuestion current,

        boolean completed,

        InterviewResultResponse result,

        String lastFeedback,

        Integer lastScore,

        String transitionMessage,

        List<String> askedQuestions

    ) {

        QuestionResponse q = current != null

            ? new QuestionResponse(current.getId(), current.getQuestionOrder(), current.getQuestion(), current.getAiFeedback(), current.getScore())

            : null;

        return new InterviewSessionResponse(

            interview.getId(),

            interview.getStatus().name(),

            interview.getCandidateName(),

            interview.getTargetRole(),

            interview.getExperienceLevel(),

            interview.getInterviewType(),

            interview.getIntroMessage(),

            q,

            interview.getQuestionCount() != null ? interview.getQuestionCount() : 0,

            completed,

            result,

            lastFeedback,

            lastScore,

            askedQuestions != null ? askedQuestions : List.of(),

            current != null ? current.getQuestion() : null,

            current != null ? current.getQuestionOrder() : null,

            transitionMessage

        );

    }



    private InterviewResultResponse buildResult(AiInterview interview) {

        List<AiInterviewQuestion> questions = questionRepo.findByInterviewIdOrderByQuestionOrderAsc(interview.getId());

        List<QuestionResponse> qResponses = questions.stream()

            .filter(q -> q.getScore() != null)

            .map(q -> new QuestionResponse(q.getId(), q.getQuestionOrder(), q.getQuestion(), q.getAiFeedback(), q.getScore()))

            .toList();



        int overall = interview.getScore() != null ? interview.getScore() : averageAnswerScore(questions);



        return new InterviewResultResponse(

            interview.getId(),

            overall,

            interview.getTechnicalScore() != null ? interview.getTechnicalScore() : 0,

            interview.getCommunicationScore() != null ? interview.getCommunicationScore() : 0,

            interview.getProblemSolvingScore() != null ? interview.getProblemSolvingScore() : 0,

            interview.getConfidenceScore() != null ? interview.getConfidenceScore() : 0,

            interview.getGrammarScore() != null ? interview.getGrammarScore() : 0,

            InterviewEvaluationService.hiringLevelFromScore(overall),

            splitPipe(interview.getStrengths()),

            splitPipe(interview.getImprovements()),

            splitPipe(interview.getRecommendedTopics()),

            qResponses

        );

    }



    private AiInterview requireInterview(UUID userId, UUID interviewId) {

        return interviewRepo.findByIdAndUserId(interviewId, userId)

            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));

    }



    private List<String> splitPipe(String value) {

        if (value == null || value.isBlank()) return List.of();

        return Arrays.stream(value.split("\\|"))

            .map(String::trim)

            .filter(s -> !s.isBlank())

            .toList();

    }



    private String firstNonBlank(String... values) {

        for (String v : values) {

            if (v != null && !v.isBlank()) return v.trim();

        }

        return "";

    }



    private String buildFallbackIntro(String name, String role, ResumeParseResponse resume) {

        String firstName = name.split("\\s+")[0];

        String skill = resume.skills().isEmpty() ? role : resume.skills().get(0);

        String project = resume.projects().isEmpty() ? "your projects" : resume.projects().get(0);

        return "Hi %s, I'm your AI interviewer today. I've reviewed your resume and see experience with %s, including %s. We'll go through technical questions based on your background — answer naturally and I'll ask follow-ups based on your responses. Let's begin."

            .formatted(firstName, skill, project);

    }



    private String difficultyLabel(int level) {

        return switch (level) {

            case 1 -> "Easy";

            case 3 -> "Hard";

            case 4, 5 -> "Expert";

            default -> "Medium";

        };

    }



    private String toJson(InterviewEvaluationResult eval) {

        try {

            return objectMapper.writeValueAsString(eval);

        } catch (Exception ex) {

            return "{}";

        }

    }



    private record AggregatedScores(

        int overall,

        int technical,

        int communication,

        int problemSolving,

        int confidence,

        int grammar,

        List<String> strengths,

        List<String> improvements,

        List<String> weakAreas

    ) {}

}

