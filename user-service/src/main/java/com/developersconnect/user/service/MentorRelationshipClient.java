package com.developersconnect.user.service;

import com.developersconnect.user.config.MentorServiceProperties;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MentorRelationshipClient {

    private static final Logger log = LoggerFactory.getLogger(MentorRelationshipClient.class);

    private final RestTemplate restTemplate;
    private final MentorServiceProperties properties;

    public MentorRelationshipClient(RestTemplate restTemplate, MentorServiceProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public boolean hasActiveRelationship(UUID mentorId, UUID studentId, String bearerToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(bearerToken);
            var response = restTemplate.exchange(
                properties.baseUrl() + "/api/mentorship/relationship/active?mentorId=" + mentorId,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
            );
            Object active = response.getBody() != null ? response.getBody().get("active") : Boolean.FALSE;
            return Boolean.TRUE.equals(active);
        } catch (Exception ex) {
            log.warn("Could not validate mentor relationship mentorId={} studentId={}: {}",
                mentorId, studentId, ex.getMessage());
            return false;
        }
    }
}
