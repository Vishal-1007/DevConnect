package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "interview_assignment_submissions")
public class InterviewAssignmentSubmission {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "assignment_id", nullable = false)
    private UUID assignmentId;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "answer_type", nullable = false, length = 16)
    private String answerType = "TEXT";

    @Column(name = "answer_text", columnDefinition = "CLOB")
    private String answerText;

    @Column(name = "answer_code", columnDefinition = "CLOB")
    private String answerCode;

    @Column(name = "code_language", length = 32)
    private String codeLanguage;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        submittedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }
    public String getAnswerType() { return answerType; }
    public void setAnswerType(String answerType) { this.answerType = answerType; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
    public String getAnswerCode() { return answerCode; }
    public void setAnswerCode(String answerCode) { this.answerCode = answerCode; }
    public String getCodeLanguage() { return codeLanguage; }
    public void setCodeLanguage(String codeLanguage) { this.codeLanguage = codeLanguage; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
