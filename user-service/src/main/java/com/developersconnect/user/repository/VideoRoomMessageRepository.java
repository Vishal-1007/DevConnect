package com.developersconnect.user.repository;

import com.developersconnect.user.model.VideoRoomMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoRoomMessageRepository extends JpaRepository<VideoRoomMessage, UUID> {

    List<VideoRoomMessage> findAllByRoomIdOrderByCreatedAtAsc(UUID roomId, Pageable pageable);
}
