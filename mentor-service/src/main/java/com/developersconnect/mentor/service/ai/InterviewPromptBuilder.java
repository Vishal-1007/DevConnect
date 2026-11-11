package com.developersconnect.mentor.service.ai;

import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class InterviewPromptBuilder {

  public static final String STRICT_INTERVIEWER_PROMPT = """
      You are a strict senior technical interviewer conducting a real company interview.
      Conduct the interview like Google or Amazon.
      Use resume information.
      Ask adaptive questions — only ONE question at a time.
      Never repeat previous questions or the same concept.
      Evaluate answers strictly in your head — do not reveal correct answers.
      One-line generic answers deserve very low scores.
      Empty answers receive zero.
      Ask follow-up questions when answers are incomplete.
      Challenge unclear answers directly.
      No fake encouragement when the candidate is wrong.
      Change topics naturally after 2-3 follow-ups on the same topic.
      """;

  public static final String SYSTEM_PROMPT = STRICT_INTERVIEWER_PROMPT;

  public String buildInterviewPrompt(
      InterviewCandidateContext candidate,
      String previousQuestion,
      String previousAnswer,
      String answerAnalysis,
      boolean retryDuplicate
  ) {
    String type = normalizeType(candidate.interviewType());
    return switch (type) {
      case "hr" -> buildHrPrompt(candidate, previousQuestion, previousAnswer, answerAnalysis, retryDuplicate);
      case "system design", "systemdesign" -> buildSystemDesignPrompt(candidate, previousQuestion, previousAnswer, answerAnalysis, retryDuplicate);
      case "mixed", "mixed interview" -> buildMixedPrompt(candidate, previousQuestion, previousAnswer, answerAnalysis, retryDuplicate);
      default -> buildTechnicalPrompt(candidate, previousQuestion, previousAnswer, answerAnalysis, retryDuplicate);
    };
  }

  public String resolveQuestionType(InterviewCandidateContext candidate) {
    String type = normalizeType(candidate.interviewType());
    if ("mixed".equals(type) || type.contains("mixed")) {
      return resolveMixedPhase(candidate.questionNumber());
    }
    return switch (type) {
      case "hr" -> "HR";
      case "system design", "systemdesign" -> "SYSTEM_DESIGN";
      default -> "TECHNICAL";
    };
  }

  public String resolveInterviewStage(int questionNumber) {
    if (questionNumber <= 1) return "Introduction";
    if (questionNumber <= 4) return "Technical Round";
    if (questionNumber <= 6) return "Project Discussion";
    if (questionNumber <= 8) return "Problem Solving";
    if (questionNumber <= 9) return "HR Questions";
    return "Final Feedback";
  }

  private String resolveMixedPhase(int questionNumber) {
    if (questionNumber <= 1) return "HR";
    if (questionNumber <= 4) return "TECHNICAL";
    if (questionNumber <= 6) return "PROJECT";
    if (questionNumber <= 8) return "SYSTEM_DESIGN";
    return "HR";
  }

  private String buildTechnicalPrompt(
      InterviewCandidateContext c,
      String previousQuestion,
      String previousAnswer,
      String answerAnalysis,
      boolean retryDuplicate
  ) {
    return SYSTEM_PROMPT + baseHeader(c, retryDuplicate) + """

        STAGE: %s
        You are a senior TECHNICAL interviewer. TECHNICAL ONLY — no pure HR questions.

        Ask about resume skills: %s
        Frameworks/technologies: %s
        Projects: %s
        Companies: %s

        Difficulty level %d (%s) for experience: %s
        %s

        %s

        %s

        Generate the NEXT question as a natural follow-up. Return ONLY the question text.
        """.formatted(
        resolveInterviewStage(c.questionNumber()),
        c.skillsLine(),
        c.technologiesLine(),
        c.projectsLine(),
        c.companies() != null && !c.companies().isEmpty() ? String.join(", ", c.companies()) : "N/A",
        c.difficultyLevel(),
        difficultyGuidance(c),
        c.experience(),
        experienceGuidance(c.experience()),
        conversationBlock(c, previousQuestion, previousAnswer),
        analysisBlock(answerAnalysis)
    );
  }

  private String buildHrPrompt(
      InterviewCandidateContext c,
      String previousQuestion,
      String previousAnswer,
      String answerAnalysis,
      boolean retryDuplicate
  ) {
    return SYSTEM_PROMPT + baseHeader(c, retryDuplicate) + """

        STAGE: HR Round
        Professional HR interviewer. NO technical syntax, coding, or system design.

        Focus: communication, leadership, teamwork, motivation, career goals.
        Experience: %s
        %s

        %s
        %s

        Return ONLY one HR question.
        """.formatted(
        c.experience(),
        hrExperienceGuidance(c.experience()),
        conversationBlock(c, previousQuestion, previousAnswer),
        analysisBlock(answerAnalysis)
    );
  }

  private String buildSystemDesignPrompt(
      InterviewCandidateContext c,
      String previousQuestion,
      String previousAnswer,
      String answerAnalysis,
      boolean retryDuplicate
  ) {
    String primaryProject = c.projects().isEmpty() ? "their main application" : c.projects().get(0);
    return SYSTEM_PROMPT + baseHeader(c, retryDuplicate) + """

        STAGE: System Design
        Ask architecture/scalability questions about: %s
        Technologies from resume: %s

        Difficulty %d for %s experience.

        %s
        %s

        Return ONLY one system design question.
        """.formatted(
        primaryProject,
        c.technologiesLine(),
        c.difficultyLevel(),
        c.experience(),
        conversationBlock(c, previousQuestion, previousAnswer),
        analysisBlock(answerAnalysis)
    );
  }

  private String buildMixedPrompt(
      InterviewCandidateContext c,
      String previousQuestion,
      String previousAnswer,
      String answerAnalysis,
      boolean retryDuplicate
  ) {
    String phase = resolveMixedPhase(c.questionNumber());
    String stage = resolveInterviewStage(c.questionNumber());
    String phaseInstructions = switch (phase) {
      case "HR" -> "Introduction/HR: motivation, teamwork, career goals. Reference resume.";
      case "TECHNICAL" -> "Technical: ask about resume skills with a follow-up from last answer.";
      case "PROJECT" -> "Project discussion: specific resume project, decisions, trade-offs.";
      case "SYSTEM_DESIGN" -> "System design: scale their project, failures, data stores.";
      default -> "Appropriate question for this interview stage.";
    };

    return SYSTEM_PROMPT + baseHeader(c, retryDuplicate) + """

        STAGE: %s | Phase: %s
        %s

        Resume:
        %s

        Difficulty %d (%s)

        %s
        %s

        Return ONLY one question for this stage.
        """.formatted(
        stage,
        phase,
        phaseInstructions,
        c.resumeSummary(),
        c.difficultyLevel(),
        difficultyGuidance(c),
        conversationBlock(c, previousQuestion, previousAnswer),
        analysisBlock(answerAnalysis)
    );
  }

  private String baseHeader(InterviewCandidateContext c, boolean retryDuplicate) {
    String dup = retryDuplicate
        ? "\nCRITICAL: Your last question was a duplicate. Generate a COMPLETELY different question on a new resume topic.\n"
        : "";
    return """

        Candidate: %s
        Role: %s
        Experience: %s
        Interview Type: %s

        Resume Summary:
        %s

        Topics already covered (do NOT repeat):
        %s
        %s
        """.formatted(
        c.name(),
        c.targetRole(),
        c.experience(),
        c.interviewType(),
        c.resumeSummary(),
        c.previousQuestions().isEmpty()
            ? "(none yet)"
            : c.previousQuestions().stream().map(q -> "- " + q).collect(Collectors.joining("\n")),
        dup
    );
  }

  private String conversationBlock(InterviewCandidateContext c, String previousQuestion, String previousAnswer) {
    return """
        Progress: Question %d of %d
        Previous Question: %s
        Candidate Answer: %s
        """.formatted(
        c.questionNumber(),
        c.maxQuestions(),
        previousQuestion != null && !previousQuestion.isBlank() ? previousQuestion : "(first question — use resume)",
        previousAnswer != null && !previousAnswer.isBlank() ? previousAnswer : "(awaiting answer)"
    );
  }

  private String analysisBlock(String answerAnalysis) {
    if (answerAnalysis == null || answerAnalysis.isBlank()) {
      return "Answer Analysis: (first question — start with resume introduction or best project)";
    }
    return "Answer Analysis (use this to craft the follow-up):\n" + answerAnalysis;
  }

  private String experienceGuidance(String experience) {
    if (experience == null) return "Ask fundamentals tied to resume skills.";
    String exp = experience.toLowerCase();
    if (exp.contains("fresher")) return "Fresher: fundamentals, syntax, simple resume projects.";
    if (exp.contains("1-3")) return "1-3 years: implementation, debugging, real project decisions.";
    if (exp.contains("3-5")) return "3-5 years: architecture, optimization, scalability.";
    if (exp.contains("5+")) return "5+ years: system design, leadership, performance at scale.";
    return "Match depth to experience and resume.";
  }

  private String hrExperienceGuidance(String experience) {
    if (experience == null) return "Entry-level HR: motivation and learning.";
    if (experience.toLowerCase().contains("fresher")) return "Career goals, learning, project stories.";
    if (experience.toLowerCase().contains("5+")) return "Leadership, mentoring, strategic decisions.";
    return "Teamwork, ownership, conflict resolution.";
  }

  private String difficultyGuidance(InterviewCandidateContext c) {
    return switch (c.difficultyLevel()) {
      case 1 -> "Fundamentals — basic concepts from resume.";
      case 2 -> "Medium — implementation and practical details.";
      case 3 -> "Architecture — design trade-offs.";
      case 4 -> "Advanced — scaling, security, distributed systems.";
      default -> "Expert — leadership technical decisions.";
    };
  }

  private String normalizeType(String interviewType) {
    if (interviewType == null) return "technical";
    return interviewType.trim().toLowerCase();
  }

  public String buildIntroPrompt(String name, String role, String interviewType, String resumeSummary) {
    return SYSTEM_PROMPT + """

        Write a 2-3 sentence spoken introduction for a live mock interview.
        Candidate: %s
        Role: %s
        Interview type: %s

        Resume highlights:
        %s

        Mention you reviewed their resume and name 1-2 specific skills or projects from it.
        Set expectations. Warm but professional. No markdown.
        """.formatted(name, role, interviewType, resumeSummary);
  }

  public String buildAdaptiveQuestionPrompt(
      InterviewCandidateContext candidate,
      String memoryJson,
      String previousQuestion,
      String previousAnswer,
      FollowUpDecisionEngine.FollowUpDecision decision,
      boolean retryDuplicate
  ) {
    String dup = retryDuplicate
        ? "\nCRITICAL: Your last question duplicated a prior question. Generate a COMPLETELY different question on a new resume topic.\n"
        : "";
    return STRICT_INTERVIEWER_PROMPT + """

        Candidate: %s
        Role: %s
        Experience: %s
        Interview Type: %s

        FULL INTERVIEW MEMORY (never repeat askedQuestions or same concepts):
        %s
        %s

        Strategy: %s
        Instruction: %s
        Target difficulty: %s

        Previous question: %s
        Candidate answer: %s

        Generate exactly ONE next interview question.
        Return ONLY the question text — no preamble, no praise, no answer reveal.
        """.formatted(
        candidate.name(),
        candidate.targetRole(),
        candidate.experience(),
        candidate.interviewType(),
        memoryJson,
        dup,
        decision.strategy().name(),
        decision.instruction(),
        decision.nextDifficulty(),
        previousQuestion != null && !previousQuestion.isBlank() ? previousQuestion : "(first question)",
        previousAnswer != null && !previousAnswer.isBlank() ? previousAnswer : "(none yet)"
    );
  }
}
