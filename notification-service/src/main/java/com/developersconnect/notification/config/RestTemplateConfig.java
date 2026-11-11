package com.developersconnect.notification.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(java.time.Duration.ofSeconds(3))
            .setReadTimeout(java.time.Duration.ofSeconds(10))
            .build();
    }
}
