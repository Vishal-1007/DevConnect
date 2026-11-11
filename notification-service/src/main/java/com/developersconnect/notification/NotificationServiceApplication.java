package com.developersconnect.notification;

import com.developersconnect.notification.config.JwtProperties;
import com.developersconnect.notification.config.InternalApiProperties;
import com.developersconnect.notification.config.ChatServiceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, InternalApiProperties.class, ChatServiceProperties.class})
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
