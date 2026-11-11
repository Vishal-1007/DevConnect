package com.developersconnect.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerLoginAndMe() throws Exception {
        String body = """
            {"username":"flowuser","email":"flow@test.com","password":"password123"}
            """;

        MvcResult register = mockMvc.perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andReturn();

        JsonNode tokens = objectMapper.readTree(register.getResponse().getContentAsString());
        String accessToken = tokens.get("accessToken").asText();

        mockMvc.perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"username":"flowuser","password":"password123"}
                        """)
            )
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(
                get("/api/auth/me")
                    .header("Authorization", "Bearer " + accessToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("flowuser"))
            .andExpect(jsonPath("$.email").value("flow@test.com"));
    }

    @Test
    void registerRejectsDuplicateUsername() throws Exception {
        String body = """
            {"username":"dupuser","email":"dup1@test.com","password":"password123"}
            """;
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        mockMvc.perform(
                post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"username":"dupuser","email":"dup2@test.com","password":"password123"}
                        """)
            )
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Username already in use. Try logging in instead."));
    }
}
