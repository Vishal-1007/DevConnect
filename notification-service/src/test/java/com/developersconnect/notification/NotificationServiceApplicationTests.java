package com.developersconnect.notification;

import static org.assertj.core.api.Assertions.assertThat;

import com.developersconnect.notification.config.SecurityConfig;
import com.developersconnect.notification.repository.NotificationRepository;
import com.developersconnect.notification.repository.ProcessedPaymentEventRepository;
import com.developersconnect.notification.service.NotificationService;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.context.ApplicationContext;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class NotificationServiceApplicationTests {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProcessedPaymentEventRepository processedPaymentEventRepository;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Test
    void contextLoads() {

        assertThat(applicationContext).isNotNull();
    }

    @Test
    void coreBeansAreRegistered() {

        assertThat(notificationService).isNotNull();

        assertThat(notificationRepository).isNotNull();

        assertThat(processedPaymentEventRepository).isNotNull();

        assertThat(securityFilterChain).isNotNull();
    }

    @Test
    void securityConfigurationIsPresent() {

        assertThat(
                applicationContext.getBean(SecurityConfig.class)
        ).isNotNull();
    }

    @Test
    void securityFilterChainBeanExists() {

        assertThat(
                applicationContext.getBeansOfType(
                        SecurityFilterChain.class
                )
        ).isNotEmpty();
    }
}