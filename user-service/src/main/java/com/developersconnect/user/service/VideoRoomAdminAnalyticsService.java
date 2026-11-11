package com.developersconnect.user.service;

import com.developersconnect.user.dto.VideoRoomAnalyticsResponse;
import com.developersconnect.user.repository.UserVideoRoomSubscriptionRepository;
import com.developersconnect.user.repository.VideoRoomPaymentTransactionRepository;
import com.developersconnect.user.repository.VideoRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VideoRoomAdminAnalyticsService {

    private final VideoRoomRepository roomRepository;
    private final UserVideoRoomSubscriptionRepository subscriptionRepository;
    private final VideoRoomPaymentTransactionRepository transactionRepository;

    public VideoRoomAdminAnalyticsService(
        VideoRoomRepository roomRepository,
        UserVideoRoomSubscriptionRepository subscriptionRepository,
        VideoRoomPaymentTransactionRepository transactionRepository
    ) {
        this.roomRepository = roomRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public VideoRoomAnalyticsResponse getAnalytics() {
        long total = roomRepository.countByParentRoomIdIsNull();
        long active = roomRepository.countByParentRoomIdIsNullAndStatus("live");
        long expired = roomRepository.countByParentRoomIdIsNullAndStatus("expired");
        long premiumUsers = subscriptionRepository.countByVideoRoomPremiumTrue();
        long payments = transactionRepository.countByPaymentStatus("completed");
        long revenue = transactionRepository.sumAmountCentsByStatus("completed");

        return new VideoRoomAnalyticsResponse(
            total,
            active,
            premiumUsers,
            payments,
            revenue,
            expired
        );
    }
}
