# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk-alpine AS build
ARG SERVICE=auth-service
WORKDIR /workspace

COPY pom.xml .
COPY events-contracts events-contracts
COPY gateway-service gateway-service
COPY auth-service auth-service
COPY user-service user-service
COPY chat-service chat-service
COPY notification-service notification-service
COPY payment-service payment-service
COPY matching-service matching-service
COPY mentor-service mentor-service
COPY analytics-service analytics-service
COPY admin-service admin-service

RUN apk add --no-cache maven \
    && mvn -q -pl "${SERVICE}" -am package -DskipTests \
    && apk del maven

FROM eclipse-temurin:21-jre-alpine
ARG SERVICE=auth-service
WORKDIR /app

COPY --from=build /workspace/${SERVICE}/target/*.jar app.jar

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
