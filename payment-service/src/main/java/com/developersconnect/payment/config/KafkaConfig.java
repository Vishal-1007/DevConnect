package com.developersconnect.payment.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import com.developersconnect.events.payment.PaymentTopics;

@Configuration
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {

    @Bean
    public NewTopic paymentEventsTopic() {
        return TopicBuilder.name(PaymentTopics.PAYMENT_EVENTS)
            .partitions(3)
            .replicas(1)
            .build();
    }
}
