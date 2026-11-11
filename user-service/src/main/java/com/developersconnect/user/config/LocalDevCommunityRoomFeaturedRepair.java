package com.developersconnect.user.config;

import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.model.VideoRoomParticipant;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import com.developersconnect.user.repository.VideoRoomRepository;
import java.util.LinkedHashSet;
import java.util.Set;
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
@Order(56)
public class LocalDevCommunityRoomFeaturedRepair implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevCommunityRoomFeaturedRepair.class);

    private final VideoRoomRepository roomRepository;
    private final VideoRoomParticipantRepository participantRepository;

    public LocalDevCommunityRoomFeaturedRepair(
        VideoRoomRepository roomRepository,
        VideoRoomParticipantRepository participantRepository
    ) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureFeatured(
            "Java Experts",
            "Deep dives on Java, Spring Boot, JVM tuning, and backend craft.",
            "java",
            LocalDevDemoProfiles.RAHUL_ID,
            1,
            Set.of("java", "spring", "experts")
        );
        ensureFeatured(
            "AI Discussion",
            "LLMs, agents, RAG pipelines, and practical AI engineering.",
            "ai",
            LocalDevDemoProfiles.SARAH_ID,
            2,
            Set.of("ai", "llm", "ml")
        );
        ensureFeatured(
            "Startup Networking",
            "Founders and builders sharing ideas, hiring, and go-to-market lessons.",
            "startup",
            LocalDevDemoProfiles.MIKE_ID,
            3,
            Set.of("startup", "networking", "founders")
        );
        ensureFeatured(
            "System Design Lounge",
            "Architecture trade-offs, scalability patterns, and collaborative mock design sessions.",
            "architecture",
            LocalDevDemoProfiles.RAHUL_ID,
            4,
            Set.of("system-design", "architecture", "lounge")
        );
        log.info("Community featured rooms ready");
    }

    private void ensureFeatured(
        String title,
        String description,
        String category,
        java.util.UUID hostId,
        int order,
        Set<String> tags
    ) {
        VideoRoom room = roomRepository.findFirstByTitleIgnoreCase(title).orElseGet(() -> {
            VideoRoom created = new VideoRoom();
            created.setHostId(hostId);
            created.setTitle(title);
            created.setDescription(description);
            created.setCategory(category);
            created.setMaxParticipants(12);
            created.setStatus("live");
            created.setUseCase("community");
            created.setVisibility("public");
            created.setTags(new LinkedHashSet<>(tags));
            VideoRoom saved = roomRepository.save(created);
            addHost(saved.getId(), hostId);
            return saved;
        });
        room.setFeatured(true);
        room.setFeaturedOrder(order);
        room.setUseCase("community");
        room.setVisibility("public");
        room.setCategory(category);
        roomRepository.save(room);
    }

    private void addHost(java.util.UUID roomId, java.util.UUID hostId) {
        if (participantRepository.existsByRoomIdAndUserIdAndLeftAtIsNull(roomId, hostId)) {
            return;
        }
        VideoRoomParticipant participant = new VideoRoomParticipant();
        participant.setRoomId(roomId);
        participant.setUserId(hostId);
        participantRepository.save(participant);
    }
}
