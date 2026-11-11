package com.developersconnect.user.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CommunityUploadProperties.class)
public class CommunityUploadConfig {
}
