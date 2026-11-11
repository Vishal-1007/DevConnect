package com.developersconnect.chat.repository;

import com.developersconnect.chat.model.ConversationMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);

    List<ConversationMember> findAllByUserId(UUID userId);

    List<ConversationMember> findAllByConversationId(UUID conversationId);

    Optional<ConversationMember> findByConversationIdAndUserId(UUID conversationId, UUID userId);
}
