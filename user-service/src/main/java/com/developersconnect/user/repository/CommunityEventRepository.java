package com.developersconnect.user.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.user.model.CommunityEvent;

public interface CommunityEventRepository extends JpaRepository<CommunityEvent, UUID> {

    List<CommunityEvent> findAllByStartsAtAfterOrderByStartsAtAsc(Instant after, Pageable pageable);

    List<CommunityEvent> findAllByStartsAtBeforeOrderByStartsAtDesc(Instant before, Pageable pageable);

    List<CommunityEvent> findAllByCategoryAndStartsAtAfterOrderByStartsAtAsc(
        String category, Instant after, Pageable pageable
    );

    List<CommunityEvent> findAllByEventTypeAndStartsAtAfterOrderByStartsAtAsc(
        String eventType, Instant after, Pageable pageable
    );

    @Query("""
        SELECT e FROM CommunityEvent e
        WHERE e.startsAt >= :after
          AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%'))
           OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY e.startsAt ASC
        """)
    List<CommunityEvent> searchUpcoming(
        @Param("query") String query,
        @Param("after") Instant after,
        Pageable pageable
    );

    long countByCancelledFalseAndStartsAtAfter(Instant after);

    long countByCancelledFalseAndStartsAtBefore(Instant before);

    long countByCancelledTrue();

    long countByEventTypeAndCancelledFalse(String eventType);

    long countByEventTypeAndCancelledFalseAndStartsAtAfter(String eventType, Instant after);

    long countByEventTypeAndHostApprovalStatusAndCancelledFalse(String eventType, String hostApprovalStatus);

    long countByEventTypeAndStreamStatusAndCancelledFalse(String eventType, String streamStatus);

    long countByEventTypeAndCancelledTrue(String eventType);

    List<CommunityEvent> findAllByHostIdAndEventTypeOrderByStartsAtDesc(
        UUID hostId, String eventType, Pageable pageable
    );

    List<CommunityEvent> findAllByHostIdOrderByStartsAtDesc(UUID hostId, Pageable pageable);
}
