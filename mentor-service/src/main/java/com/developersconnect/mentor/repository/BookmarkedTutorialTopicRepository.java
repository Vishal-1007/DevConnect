package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.BookmarkedTutorialTopic;
import com.developersconnect.mentor.model.BookmarkedTutorialTopic.BookmarkId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkedTutorialTopicRepository extends JpaRepository<BookmarkedTutorialTopic, BookmarkId> {
    List<BookmarkedTutorialTopic> findByUserId(UUID userId);
    boolean existsByUserIdAndTopicId(UUID userId, UUID topicId);
    void deleteByUserIdAndTopicId(UUID userId, UUID topicId);
}
