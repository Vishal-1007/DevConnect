package com.developersconnect.user.config;

import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.model.VideoRoomParticipant;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import com.developersconnect.user.repository.VideoRoomRepository;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@Order(55)
public class LocalDevVideoRoomsSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevVideoRoomsSeeder.class);

    private final VideoRoomRepository roomRepository;
    private final VideoRoomParticipantRepository participantRepository;

    public LocalDevVideoRoomsSeeder(
        VideoRoomRepository roomRepository,
        VideoRoomParticipantRepository participantRepository
    ) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roomRepository.count() > 0) {
            return;
        }

        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "System Design Discussion",
            "Open room for architecture trade-offs, capacity planning, and mock interview prep.",
            "architecture",
            8,
            Set.of("system-design", "architecture"),
            new UUID[] { LocalDevDemoProfiles.SARAH_ID, LocalDevDemoProfiles.MIKE_ID }
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "React Performance Tips",
            "Share profiling results, memoization patterns, and concurrent rendering wins.",
            "frontend",
            10,
            Set.of("react", "frontend", "performance"),
            new UUID[] { LocalDevDemoProfiles.RAHUL_ID, LocalDevDemoProfiles.MIKE_ID }
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "DSA Problem Solving",
            "Collaborative problem solving — graphs, DP, and interview-style walkthroughs.",
            "interview-prep",
            6,
            Set.of("dsa", "algorithms"),
            new UUID[] { LocalDevDemoProfiles.SARAH_ID }
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "Spring Boot Office Hours",
            "Ask questions about REST APIs, JPA, security, and microservice patterns.",
            "backend",
            12,
            Set.of("java", "spring", "backend"),
            new UUID[] { LocalDevDemoProfiles.MIKE_ID }
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "Portfolio & Resume Review",
            "Live feedback on projects, GitHub profiles, and resume bullet points.",
            "career",
            8,
            Set.of("career", "portfolio"),
            new UUID[] {}
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "Kubernetes Study Group",
            "Walk through deployments, services, ingress, and observability basics.",
            "devops",
            10,
            Set.of("kubernetes", "devops", "cloud"),
            new UUID[] { LocalDevDemoProfiles.RAHUL_ID, LocalDevDemoProfiles.SARAH_ID }
        );

        log.info("Seeded {} local video rooms", roomRepository.count());
    }

    private void seed(
        java.util.UUID hostId,
        String title,
        String description,
        String category,
        int maxParticipants,
        Set<String> tags,
        UUID[] extraParticipants
    ) {
        VideoRoom room = new VideoRoom();
        room.setHostId(hostId);
        room.setTitle(title);
        room.setDescription(description);
        room.setCategory(category);
        room.setMaxParticipants(maxParticipants);
        room.setStatus("live");
        room.setUseCase("community");
        room.setVisibility("public");
        room.setTags(new LinkedHashSet<>(tags));
        VideoRoom saved = roomRepository.save(room);

        addParticipant(saved.getId(), hostId);
        for (UUID userId : extraParticipants) {
            if (!userId.equals(hostId)) {
                addParticipant(saved.getId(), userId);
            }
        }
    }

    private void addParticipant(java.util.UUID roomId, java.util.UUID userId) {
        if (participantRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId)) {
            return;
        }
        VideoRoomParticipant participant = new VideoRoomParticipant();
        participant.setRoomId(roomId);
        participant.setUserId(userId);
        participantRepository.save(participant);
    }
}
