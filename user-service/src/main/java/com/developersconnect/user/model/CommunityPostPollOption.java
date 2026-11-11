package com.developersconnect.user.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "community_post_poll_options")
public class CommunityPostPollOption {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private UUID pollId;

    @Column(nullable = false, length = 120)
    private String optionText;

    @Column(nullable = false)
    private long voteCount;

    @Column(nullable = false)
    private int sortOrder;

    public UUID getId() {
        return id;
    }

    public UUID getPollId() {
        return pollId;
    }

    public void setPollId(UUID pollId) {
        this.pollId = pollId;
    }

    public String getOptionText() {
        return optionText;
    }

    public void setOptionText(String optionText) {
        this.optionText = optionText;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
