package com.developersconnect.mentor.model;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_interview_questions")
public class AiInterviewQuestion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "interview_id", nullable = false)
    private UUID interviewId;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(name = "user_answer", length = 8000)
    private String userAnswer;

    @Column(name = "ai_feedback", length = 4000)
    private String aiFeedback;

    @Column
    private Integer score;

    @Column(name = "question_type", length = 32)
    private String questionType;

    @Column(name = "technical_score")
    private Integer technicalScore;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "grammar_score")
    private Integer grammarScore;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "feedback_json", columnDefinition = "TEXT")
    private String feedbackJson;

    @Column(length = 64)
    private String topic;

    @Column(length = 16)
    private String difficulty;

    @Column(name = "answer_time_seconds")
    private Integer answerTimeSeconds;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getInterviewId() { return interviewId; }
    public void setInterviewId(UUID interviewId) { this.interviewId = interviewId; }
    public int getQuestionOrder() { return questionOrder; }
    public void setQuestionOrder(int questionOrder) { this.questionOrder = questionOrder; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }
    public String getAiFeedback() { return aiFeedback; }
    public void setAiFeedback(String aiFeedback) { this.aiFeedback = aiFeedback; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public Integer getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Integer technicalScore) { this.technicalScore = technicalScore; }
    public Integer getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(Integer communicationScore) { this.communicationScore = communicationScore; }
    public Integer getGrammarScore() { return grammarScore; }
    public void setGrammarScore(Integer grammarScore) { this.grammarScore = grammarScore; }
    public Integer getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }
    public String getFeedbackJson() { return feedbackJson; }
    public void setFeedbackJson(String feedbackJson) { this.feedbackJson = feedbackJson; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public Integer getAnswerTimeSeconds() { return answerTimeSeconds; }
    public void setAnswerTimeSeconds(Integer answerTimeSeconds) { this.answerTimeSeconds = answerTimeSeconds; }
    public Instant getCreatedAt() { return createdAt; }
}
