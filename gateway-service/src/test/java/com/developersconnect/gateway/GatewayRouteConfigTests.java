package com.developersconnect.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import reactor.test.StepVerifier;

@SpringBootTest
class GatewayRouteConfigTests {

    @Autowired
    private RouteLocator routeLocator;

    @Test
    void loadsExpectedServiceRoutes() {
        StepVerifier.create(routeLocator.getRoutes().collectList())
            .assertNext(routes -> {
                assertThat(routes).extracting(Route::getId)
                    .contains(
                        "auth-service",
                        "user-service",
                        "chat-service-rest",
                        "chat-service-websocket",
                        "notification-service",
                        "payment-service",
                        "matching-service",
                        "mentor-service",
                        "analytics-service",
                        "admin-service"
                    );
            })
            .verifyComplete();
    }
}
