package com.developersconnect.payment.repository;

import com.developersconnect.payment.model.FinancialTransaction;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {

    Optional<FinancialTransaction> findByLinkedPaymentId(UUID linkedPaymentId);

    Optional<FinancialTransaction> findByTransactionCode(String transactionCode);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(t.platformRevenueCents), 0) FROM FinancialTransaction t WHERE t.status = 'completed'")
    long sumPlatformRevenueCents();

    @Query("SELECT COALESCE(SUM(t.amountCents), 0) FROM FinancialTransaction t WHERE t.status = 'completed' AND t.transactionType = 'payment'")
    long sumCompletedPaymentCents();

    @Query("SELECT COALESCE(SUM(t.amountCents), 0) FROM FinancialTransaction t WHERE t.status = 'completed' AND t.transactionType = 'refund'")
    long sumRefundCents();

    @Query("""
        SELECT COALESCE(SUM(t.platformRevenueCents), 0) FROM FinancialTransaction t
        WHERE t.status = 'completed'
          AND t.createdAt >= :from
          AND t.createdAt < :to
        """)
    long sumRevenueBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        SELECT t FROM FinancialTransaction t
        WHERE (:status IS NULL OR t.status = :status)
          AND (:type IS NULL OR t.transactionType = :type)
          AND (
            :failedOnly = false OR t.status = 'failed'
          )
          AND (
            :refundOnly = false OR t.transactionType = 'refund'
          )
          AND (
            :query IS NULL OR :query = ''
            OR LOWER(t.transactionCode) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(t.payerDisplayName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(t.payeeDisplayName) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY t.createdAt DESC
        """)
    List<FinancialTransaction> search(
        @Param("status") String status,
        @Param("type") String type,
        @Param("failedOnly") boolean failedOnly,
        @Param("refundOnly") boolean refundOnly,
        @Param("query") String query,
        Pageable pageable
    );

    @Query("SELECT t.transactionType, COUNT(t) FROM FinancialTransaction t GROUP BY t.transactionType")
    List<Object[]> countGroupByType();
}
