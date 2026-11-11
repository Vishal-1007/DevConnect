package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.UserServiceProperties;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ContentNotificationService {

    private static final Logger log = LoggerFactory.getLogger(ContentNotificationService.class);

    private final RestTemplate restTemplate;
    private final UserServiceProperties userServiceProperties;

    public ContentNotificationService(RestTemplate restTemplate, UserServiceProperties userServiceProperties) {
        this.restTemplate = restTemplate;
        this.userServiceProperties = userServiceProperties;
    }

    public void notifyLearningResourcePublished(String title, UUID actorId) {
        broadcast(
            "New tutorial published: " + title,
            "A new learning resource \"" + title + "\" is now available in Learning Resources.",
            "learning_resource_update",
            "LEARNERS",
            actorId
        );
    }

    public void notifyLearningStreamPublished(String title, UUID actorId) {
        broadcast(
            "New course published: " + title,
            "A new video course \"" + title + "\" is now available in Learning Streams.",
            "learning_stream_update",
            "ALL_USERS",
            actorId
        );
    }

    public void notifyInterviewPackPublished(String title, UUID mentorId) {
        broadcast(
            "New interview pack: " + title,
            "A new interview question pack \"" + title + "\" is now available in the Interview Marketplace.",
            "interview_pack_published",
            "LEARNERS",
            mentorId
        );
    }

    public void notifyInterviewAssignmentReceived(UUID learnerId, String packTitle, UUID mentorId) {
        notifyUser(
            learnerId,
            "New assessment assigned",
            "You have been assigned \"" + packTitle + "\". Open Mock Interviews to start.",
            "interview_assignment",
            mentorId
        );
    }

    public void notifyInterviewPackPurchased(String packTitle, UUID learnerId, UUID mentorId) {
        notifyUser(
            learnerId,
            "Purchase successful",
            "You now have access to \"" + packTitle + "\". View it in My Purchases.",
            "interview_purchase",
            mentorId
        );
        notifyUser(
            mentorId,
            "Pack purchased",
            "A learner purchased your interview pack \"" + packTitle + "\".",
            "interview_sale",
            learnerId
        );
    }

    public void notifyInterviewSubmissionReceived(UUID mentorId, UUID learnerId, UUID assignmentId) {
        notifyUser(
            mentorId,
            "New submission received",
            "A learner submitted answers for review. Check your mentor dashboard.",
            "interview_submission",
            learnerId
        );
    }

    public void notifyInterviewFeedbackAvailable(UUID learnerId, UUID assignmentId) {
        notifyUser(
            learnerId,
            "Feedback available",
            "Your mentor has reviewed your assessment. View feedback in Mock Interviews.",
            "interview_feedback",
            null
        );
    }

    private void notifyUser(UUID userId, String title, String message, String type, UUID actorId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("message", message);
        payload.put("type", type);
        payload.put("audience", "SPECIFIC_USERS");
        payload.put("specificUserIds", List.of(userId));
        payload.put("createdBy", actorId);
        postBroadcast(payload);
    }

    private void broadcast(String title, String message, String type, String audience, UUID actorId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("message", message);
        payload.put("type", type);
        payload.put("audience", audience);
        payload.put("createdBy", actorId);
        postBroadcast(payload);
    }

    private void postBroadcast(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Api-Key", userServiceProperties.internalApiKey());

        try {
            restTemplate.postForEntity(
                userServiceProperties.baseUrl() + "/api/users/internal/notifications/broadcast",
                new HttpEntity<>(payload, headers),
                Integer.class
            );
        } catch (Exception ex) {
            log.warn("Failed to broadcast content notification: {}", ex.getMessage());
        }
    }
}
