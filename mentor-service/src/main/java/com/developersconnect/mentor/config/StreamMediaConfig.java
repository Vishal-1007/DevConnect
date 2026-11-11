package com.developersconnect.mentor.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(StreamMediaProperties.class)
public class StreamMediaConfig {
}
