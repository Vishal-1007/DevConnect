package com.developersconnect.chat.service;

import com.developersconnect.chat.dto.MessageResponse;
import com.developersconnect.chat.dto.SendMessageRequest;
import com.developersconnect.chat.model.Conversation;
import com.developersconnect.chat.model.Message;
import com.developersconnect.chat.repository.ConversationMemberRepository;
import com.developersconnect.chat.repository.ConversationRepository;
import com.developersconnect.chat.repository.MessageRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(
        ConversationRepository conversationRepository,
        ConversationMemberRepository memberRepository,
        MessageRepository messageRepository,
        SimpMessagingTemplate messagingTemplate
    ) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, UUID senderId, SendMessageRequest request) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, senderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));

        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderId(senderId);
        message.setContent(request.content());

        Message saved = messageRepository.save(message);
        MessageResponse response = toResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
        return response;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> listMessages(UUID conversationId, UUID userId, int limit) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }

        return messageRepository.findAllByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(0, limit))
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private MessageResponse toResponse(Message message) {
        return new MessageResponse(
            message.getId(),
            message.getConversation().getId(),
            message.getSenderId(),
            message.getContent(),
            message.getCreatedAt()
        );
    }
}
