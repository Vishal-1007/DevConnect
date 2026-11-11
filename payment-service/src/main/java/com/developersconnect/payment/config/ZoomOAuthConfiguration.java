package com.developersconnect.payment.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ZoomOAuthProperties.class)
public class ZoomOAuthConfiguration {

    private static final Logger log = LoggerFactory.getLogger(ZoomOAuthConfiguration.class);

    ZoomOAuthConfiguration(ZoomOAuthProperties properties) {
        log.info(
            "Zoom OAuth config loaded: client_id={} redirect_uri={} scopes={}",
            properties.getClientId(),
            properties.getRedirectUri(),
            properties.getScopes()
        );
    }
}
