package com.developersconnect.mentor.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.developersconnect.mentor.model.MentorshipBooking;

public interface MentorshipBookingRepository
        extends JpaRepository<MentorshipBooking, UUID> {

    Optional<MentorshipBooking> findByBookingCode(
            String bookingCode
    );

    long countByStatus(String status);

    long countByRefundStatus(String refundStatus);

    @Query(
        "SELECT COALESCE(SUM(b.amountCents), 0) " +
        "FROM MentorshipBooking b " +
        "WHERE b.status IN ('confirmed', 'completed')"
    )
    long sumRevenueCents();

    @Query(
        "SELECT COALESCE(SUM(b.amountCents), 0) " +
        "FROM MentorshipBooking b " +
        "WHERE b.status = 'refunded'"
    )
    long sumRefundedCents();

    @Query(
        "SELECT b FROM MentorshipBooking b " +
        "WHERE (:status IS NULL OR b.status = :status) " +
        "AND ( " +
        "   :refundOnly = false " +
        "   OR b.refundStatus IN ('requested', 'approved') " +
        "   OR b.status = 'refund_requested' " +
        ") " +
        "AND ( " +
        "   :query IS NULL OR :query = '' " +
        "   OR LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
        "   OR LOWER(b.mentorDisplayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
        "   OR LOWER(b.learnerDisplayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
        ") " +
        "ORDER BY b.scheduledAt DESC"
    )
    List<MentorshipBooking> search(
            @Param("status") String status,
            @Param("refundOnly") boolean refundOnly,
            @Param("query") String query,
            Pageable pageable
    );

    @Query(
        "SELECT b.status, COUNT(b) " +
        "FROM MentorshipBooking b " +
        "GROUP BY b.status"
    )
    List<Object[]> countGroupByStatus();

    List<MentorshipBooking>
    findByMentorIdOrderByScheduledAtDesc(
            UUID mentorId,
            Pageable pageable
    );

    List<MentorshipBooking>
    findByMentorIdAndScheduledAtBetweenOrderByScheduledAtAsc(
            UUID mentorId,
            Instant start,
            Instant end
    );

    long countByMentorIdAndStatus(
            UUID mentorId,
            String status
    );

    @Query(
        "SELECT COALESCE(SUM(b.amountCents), 0) " +
        "FROM MentorshipBooking b " +
        "WHERE b.mentorId = :mentorId " +
        "AND b.status IN ('confirmed', 'completed')"
    )
    long sumRevenueCentsByMentorId(
            @Param("mentorId") UUID mentorId
    );

    @Query(
        "SELECT COALESCE(SUM(b.amountCents), 0) " +
        "FROM MentorshipBooking b " +
        "WHERE b.mentorId = :mentorId " +
        "AND b.status IN ('confirmed', 'completed') " +
        "AND b.scheduledAt >= :since " +
        "AND b.scheduledAt < :until"
    )
    long sumRevenueCentsByMentorIdBetween(
            @Param("mentorId") UUID mentorId,
            @Param("since") Instant since,
            @Param("until") Instant until
    );

    @Query(
        "SELECT COUNT(DISTINCT b.learnerId) " +
        "FROM MentorshipBooking b " +
        "WHERE b.mentorId = :mentorId " +
        "AND b.status IN ('pending', 'confirmed', 'completed')"
    )
    long countDistinctActiveStudents(
            @Param("mentorId") UUID mentorId
    );
}