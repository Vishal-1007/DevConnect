package com.developersconnect.chat.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:5174}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toArray(String[]::new);

        // Native WebSocket endpoint — used by the frontend STOMP client directly.
        // More reliable than SockJS through a reverse proxy because there is no
        // HTTP info-request / transport-negotiation phase that can be dropped.
        registry.addEndpoint("/ws/stomp")
            .setAllowedOriginPatterns("*");

        // Keep the SockJS endpoint for any legacy/fallback clients.
        registry.addEndpoint("/ws/chat")
            .setAllowedOriginPatterns(origins)
            .withSockJS();
    }
}
