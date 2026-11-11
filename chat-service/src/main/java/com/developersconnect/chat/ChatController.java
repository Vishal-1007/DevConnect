package com.developersconnect.chat;

import com.developersconnect.chat.dto.ConversationResponse;
import com.developersconnect.chat.dto.CreateConversationRequest;
import com.developersconnect.chat.dto.MessageResponse;
import com.developersconnect.chat.dto.SendMessageRequest;
import com.developersconnect.chat.security.AuthPrincipal;
import com.developersconnect.chat.service.ConversationService;
import com.developersconnect.chat.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ChatController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> createConversation(
        Authentication authentication,
        @Valid @RequestBody CreateConversationRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(conversationService.createConversation(principal.accountId(), request));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> listConversations(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.listConversations(principal.accountId()));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(conversationService.getConversation(id, principal.accountId()));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody SendMessageRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(messageService.sendMessage(id, principal.accountId(), request));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageResponse>> listMessages(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestParam(defaultValue = "50") int limit
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return ResponseEntity.ok(messageService.listMessages(id, principal.accountId(), safeLimit));
    }
}
