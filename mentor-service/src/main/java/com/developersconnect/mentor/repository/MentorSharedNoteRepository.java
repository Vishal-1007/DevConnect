package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.MentorSharedNote;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MentorSharedNoteRepository extends JpaRepository<MentorSharedNote, UUID> {

    List<MentorSharedNote> findByMentorIdOrderByUpdatedAtDesc(UUID mentorId);

    Optional<MentorSharedNote> findByIdAndMentorId(UUID id, UUID mentorId);

    long countByMentorId(UUID mentorId);
}
