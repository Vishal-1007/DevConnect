package com.developersconnect.chat.repository;

import com.developersconnect.chat.model.Conversation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
}
