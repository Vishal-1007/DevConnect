package com.developersconnect.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "interview_question_set_items")
@IdClass(InterviewQuestionSetItem.ItemId.class)
public class InterviewQuestionSetItem {

    @Id
    @Column(name = "question_set_id")
    private UUID questionSetId;

    @Id
    @Column(name = "question_id")
    private UUID questionId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public UUID getQuestionSetId() { return questionSetId; }
    public void setQuestionSetId(UUID questionSetId) { this.questionSetId = questionSetId; }
    public UUID getQuestionId() { return questionId; }
    public void setQuestionId(UUID questionId) { this.questionId = questionId; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public static class ItemId implements Serializable {
        private UUID questionSetId;
        private UUID questionId;

        public ItemId() {}

        public ItemId(UUID questionSetId, UUID questionId) {
            this.questionSetId = questionSetId;
            this.questionId = questionId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ItemId other)) return false;
            return questionSetId.equals(other.questionSetId) && questionId.equals(other.questionId);
        }

        @Override
        public int hashCode() {
            return questionSetId.hashCode() * 31 + questionId.hashCode();
        }
    }
}
