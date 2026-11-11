package com.developersconnect.user.service;

import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.repository.VideoRoomRepository;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VideoRoomExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(VideoRoomExpiryScheduler.class);

    private final VideoRoomRepository roomRepository;
    private final VideoRoomService videoRoomService;

    public VideoRoomExpiryScheduler(VideoRoomRepository roomRepository, VideoRoomService videoRoomService) {
        this.roomRepository = roomRepository;
        this.videoRoomService = videoRoomService;
    }

    @Scheduled(fixedRate = 60_000)
    public void expireFreeRooms() {
        List<VideoRoom> expired = roomRepository.findFreeRoomsPastExpiry(Instant.now(), PageRequest.of(0, 50));
        for (VideoRoom room : expired) {
            try {
                videoRoomService.expireRoom(room.getId());
            } catch (Exception ex) {
                log.warn("Failed to expire room {}: {}", room.getId(), ex.getMessage());
            }
        }
    }
}
