package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.TopicContent;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicContentRepository extends JpaRepository<TopicContent, UUID> {
    Optional<TopicContent> findByTopicId(UUID topicId);
    List<TopicContent> findByTopicIdIn(Collection<UUID> topicIds);
    void deleteByTopicId(UUID topicId);
}
