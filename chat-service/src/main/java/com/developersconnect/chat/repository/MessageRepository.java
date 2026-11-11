package com.developersconnect.chat.repository;

import com.developersconnect.chat.model.Message;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
        """)
    List<Message> findAllByConversationIdOrderByCreatedAtDesc(
        @Param("conversationId") UUID conversationId,
        Pageable pageable
    );
}
