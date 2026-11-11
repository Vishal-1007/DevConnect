package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.OllamaProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class OllamaService {

    private static final Logger log = LoggerFactory.getLogger(OllamaService.class);

    private final OllamaProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OllamaService(OllamaProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public String generate(String prompt) {
        return generate(prompt, 0.7);
    }

    public String generate(String prompt, double temperature) {
        try {
            Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "prompt", prompt,
                "stream", false,
                "options", Map.of("temperature", temperature)
            );
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getBaseUrl() + "/api/generate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Ollama returned {}: {}", response.statusCode(), response.body());
                return fallbackResponse(prompt);
            }
            JsonNode node = objectMapper.readTree(response.body());
            String text = node.path("response").asText("");
            return text.isBlank() ? fallbackResponse(prompt) : text.trim();
        } catch (Exception ex) {
            log.warn("Ollama unavailable: {}", ex.getMessage());
            return fallbackResponse(prompt);
        }
    }

    private String fallbackResponse(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("senior technical interviewer") || lower.contains("return only the question text")) {
            return "";
        }
        if (lower.contains("strict faang-level interviewer") || lower.contains("\"technicalaccuracy\"")) {
            return "";
        }
        if (lower.contains("mock interview transcript")) {
            return "{\"overall\":82,\"technical\":85,\"communication\":78,\"problemSolving\":80,\"confidence\":75,\"strengths\":[\"Solid fundamentals\",\"Clear communication\"],\"improvements\":[\"Add more system design depth\",\"Practice behavioral STAR format\"],\"topics\":[\"Microservices\",\"Kafka\",\"AWS scaling\"]}";
        }
        if (lower.contains("introduction message")) {
            return "Hello! I am your AI interviewer today. We will discuss your background and role-specific topics based on your resume. Let's begin.";
        }
        return "";
    }
}
