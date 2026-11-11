package com.developersconnect.notification.messaging;

import com.developersconnect.events.payment.PaymentEventEnvelope;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

@Configuration
@EnableKafka
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentKafkaConfig {

    @Bean
    public ConsumerFactory<String, PaymentEventEnvelope> paymentConsumerFactory(KafkaProperties kafkaProperties) {
        Map<String, Object> props = new HashMap<>(kafkaProperties.buildConsumerProperties(null));
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.developersconnect.events.payment");
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, PaymentEventEnvelope.class.getName());
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaConsumerFactory<>(
            props,
            new StringDeserializer(),
            new JsonDeserializer<>(PaymentEventEnvelope.class, false)
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, PaymentEventEnvelope> paymentKafkaListenerContainerFactory(
        ConsumerFactory<String, PaymentEventEnvelope> paymentConsumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, PaymentEventEnvelope> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(paymentConsumerFactory);
        return factory;
    }
}
