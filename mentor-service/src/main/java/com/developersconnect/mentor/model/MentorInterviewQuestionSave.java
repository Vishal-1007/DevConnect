package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "mentor_interview_question_saves")
@IdClass(MentorInterviewQuestionSave.SaveId.class)
public class MentorInterviewQuestionSave {

    @Id
    @Column(nullable = false)
    private UUID mentorId;

    @Id
    @Column(nullable = false)
    private UUID questionId;

    @Column(nullable = false)
    private Instant savedAt;

    @PrePersist
    void onCreate() {
        savedAt = Instant.now();
    }

    public UUID getMentorId() { return mentorId; }
    public void setMentorId(UUID mentorId) { this.mentorId = mentorId; }
    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }
    public Instant getSavedAt() { return savedAt; }

    public static class SaveId implements Serializable {
        private UUID mentorId;
        private UUID questionId;

        public SaveId() {}

        public SaveId(UUID mentorId, UUID questionId) {
            this.mentorId = mentorId;
            this.questionId = questionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SaveId saveId)) return false;
            return Objects.equals(mentorId, saveId.mentorId) && Objects.equals(questionId, saveId.questionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(mentorId, questionId);
        }
    }
}
