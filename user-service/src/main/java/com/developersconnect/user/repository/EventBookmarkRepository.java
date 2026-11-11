package com.developersconnect.user.repository;

import com.developersconnect.user.model.EventBookmark;
import com.developersconnect.user.model.EventBookmark.BookmarkId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventBookmarkRepository extends JpaRepository<EventBookmark, BookmarkId> {

    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

    List<EventBookmark> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    void deleteByEventIdAndUserId(UUID eventId, UUID userId);
}
