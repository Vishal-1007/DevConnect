package com.developersconnect.chat.service;

import com.developersconnect.chat.dto.ConversationResponse;
import com.developersconnect.chat.dto.CreateConversationRequest;
import com.developersconnect.chat.model.Conversation;
import com.developersconnect.chat.model.ConversationMember;
import com.developersconnect.chat.repository.ConversationMemberRepository;
import com.developersconnect.chat.repository.ConversationRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConversationService {

    private static final String ROLE_MEMBER = "MEMBER";

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;

    public ConversationService(
        ConversationRepository conversationRepository,
        ConversationMemberRepository memberRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public ConversationResponse createConversation(UUID creatorId, CreateConversationRequest request) {
        if (request.participantIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participants required");
        }
        Conversation conversation = new Conversation();
        conversation.setCreatedBy(creatorId);
        Conversation saved = conversationRepository.save(conversation);

        List<UUID> participants = new ArrayList<>(request.participantIds());
        if (!participants.contains(creatorId)) {
            participants.add(creatorId);
        }

        for (UUID participantId : participants) {
            ConversationMember member = new ConversationMember();
            member.setConversation(saved);
            member.setUserId(participantId);
            member.setRole(ROLE_MEMBER);
            memberRepository.save(member);
        }

        return toResponse(saved, participants);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(UUID userId) {
        return memberRepository.findAllByUserId(userId).stream()
            .map(member -> toResponse(member.getConversation(), getParticipants(member.getConversation().getId())))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID conversationId, UUID userId) {
        assertMember(conversationId, userId);
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        return toResponse(conversation, getParticipants(conversationId));
    }

    private void assertMember(UUID conversationId, UUID userId) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this conversation");
        }
    }

    private List<UUID> getParticipants(UUID conversationId) {
        return memberRepository.findAllByConversationId(conversationId).stream()
            .map(ConversationMember::getUserId)
            .collect(Collectors.toList());
    }

    private ConversationResponse toResponse(Conversation conversation, List<UUID> participants) {
        return new ConversationResponse(
            conversation.getId(),
            conversation.getCreatedBy(),
            participants,
            conversation.getCreatedAt(),
            conversation.getUpdatedAt()
        );
    }
}
