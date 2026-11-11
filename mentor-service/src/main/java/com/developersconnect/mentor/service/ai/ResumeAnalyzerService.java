package com.developersconnect.mentor.service.ai;

import com.developersconnect.mentor.dto.AiInterviewDtos.ResumeParseResponse;
import com.developersconnect.mentor.model.AiInterview;
import com.developersconnect.mentor.model.AiInterviewQuestion;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ResumeAnalyzerService {

    public String buildSummary(ResumeParseResponse resume) {
        StringBuilder sb = new StringBuilder();
        if (resume.experience() != null && !resume.experience().isBlank()) {
            sb.append("Experience: ").append(resume.experience().trim()).append("\n");
        }
        if (!resume.skills().isEmpty()) {
            sb.append("Skills: ").append(String.join(", ", resume.skills())).append("\n");
        }
        if (!resume.technologies().isEmpty()) {
            sb.append("Technologies: ").append(String.join(", ", resume.technologies())).append("\n");
        }
        if (!resume.projects().isEmpty()) {
            sb.append("Projects: ").append(String.join("; ", resume.projects())).append("\n");
        }
        if (!resume.companies().isEmpty()) {
            sb.append("Companies: ").append(String.join(", ", resume.companies())).append("\n");
        }
        if (resume.education() != null && !resume.education().isBlank()) {
            sb.append("Education: ").append(resume.education().trim()).append("\n");
        }
        if (resume.rawText() != null && !resume.rawText().isBlank()) {
            String raw = resume.rawText().trim();
            if (raw.length() > 1500) raw = raw.substring(0, 1500) + "...";
            sb.append("Resume excerpt:\n").append(raw);
        }
        return sb.toString().trim();
    }

    public List<String> extractFocusTopics(ResumeParseResponse resume) {
        List<String> topics = new ArrayList<>();
        topics.addAll(resume.skills());
        topics.addAll(resume.technologies());
        topics.addAll(resume.projects());
        return topics.stream()
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .distinct()
            .limit(20)
            .toList();
    }

    public InterviewCandidateContext buildContext(
        AiInterview interview,
        ResumeParseResponse resume,
        List<AiInterviewQuestion> conversation,
        int questionNumber,
        int maxQuestions
    ) {
        List<String> questions = conversation.stream().map(AiInterviewQuestion::getQuestion).toList();
        List<String> answers = conversation.stream()
            .map(q -> q.getUserAnswer() != null ? q.getUserAnswer() : "")
            .toList();

        int difficulty = interview.getDifficultyLevel() != null ? interview.getDifficultyLevel() : 1;
        String rawText = resume.rawText() != null ? resume.rawText() : buildSummary(resume);

        return new InterviewCandidateContext(
            interview.getCandidateName(),
            interview.getTargetRole(),
            interview.getExperienceLevel(),
            interview.getInterviewType(),
            resume.skills(),
            resume.projects(),
            resume.technologies(),
            resume.companies(),
            resume.education(),
            rawText,
            buildSummary(resume),
            questions,
            answers,
            difficulty,
            questionNumber,
            maxQuestions
        );
    }
}
