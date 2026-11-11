package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewQuestionSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewQuestionSetRepository extends JpaRepository<InterviewQuestionSet, UUID> {

    List<InterviewQuestionSet> findByMentorIdAndDeletedAtIsNullOrderByUpdatedAtDesc(UUID mentorId);

    Optional<InterviewQuestionSet> findByIdAndMentorIdAndDeletedAtIsNull(UUID id, UUID mentorId);

    Optional<InterviewQuestionSet> findByIdAndDeletedAtIsNull(UUID id);

    Page<InterviewQuestionSet> findByDeletedAtIsNullAndStatusAndVisibilityIn(
        String status,
        List<String> visibilities,
        Pageable pageable
    );

    List<InterviewQuestionSet> findByDeletedAtIsNullAndStatusAndVisibilityInOrderByPublishedAtDesc(
        String status,
        List<String> visibilities
    );

    long countByDeletedAtIsNullAndStatusAndVisibilityIn(String status, List<String> visibilities);

    long countByMentorIdAndDeletedAtIsNull(UUID mentorId);

    long countByMentorIdAndVisibilityAndDeletedAtIsNull(UUID mentorId, String visibility);
}
