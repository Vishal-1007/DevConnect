package com.developersconnect.chat;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.developersconnect.chat.security.AuthPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class ChatFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createConversationAndSendMessage() throws Exception {
        UUID userA = UUID.randomUUID();
        UUID userB = UUID.randomUUID();
        var auth = auth(userA, "userA");

        String createBody = objectMapper.writeValueAsString(
            java.util.Map.of("participantIds", List.of(userB))
        );

        String conversationJson = mockMvc.perform(
                post("/api/chats/conversations")
                    .with(authentication(auth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.participants.length()").value(2))
            .andReturn()
            .getResponse()
            .getContentAsString();

        String conversationId = objectMapper.readTree(conversationJson).get("id").asText();

        mockMvc.perform(get("/api/chats/conversations").with(authentication(auth)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(conversationId));

        mockMvc.perform(
                post("/api/chats/conversations/" + conversationId + "/messages")
                    .with(authentication(auth))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"content":"hello there"}
                        """)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.content").value("hello there"));

        mockMvc.perform(
                get("/api/chats/conversations/" + conversationId + "/messages")
                    .with(authentication(auth))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].content").value("hello there"));
    }

    @Test
    void unauthenticatedRequestsReturn401() throws Exception {
        mockMvc.perform(get("/api/chats/conversations"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    private UsernamePasswordAuthenticationToken auth(UUID accountId, String username) {
        AuthPrincipal principal = new AuthPrincipal(accountId, username, "USER");
        return new UsernamePasswordAuthenticationToken(
            principal,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
