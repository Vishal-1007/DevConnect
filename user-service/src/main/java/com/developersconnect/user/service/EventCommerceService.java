package com.developersconnect.user.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.dto.ConfirmEventPaymentRequest;
import com.developersconnect.user.dto.EventCategoryStatResponse;
import com.developersconnect.user.dto.EventOrderResponse;
import com.developersconnect.user.dto.EventPaymentSummaryResponse;
import com.developersconnect.user.dto.EventRevenueAnalyticsResponse;
import com.developersconnect.user.dto.EventStatsResponse;
import com.developersconnect.user.dto.MentorEventDashboardResponse;
import com.developersconnect.user.dto.PopularHostResponse;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.CommunityEventRegistration;
import com.developersconnect.user.model.EventBookmark;
import com.developersconnect.user.model.EventPayment;
import com.developersconnect.user.model.EventWithdrawal;
import com.developersconnect.user.model.MentorWallet;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.CommunityEventRepository;
import com.developersconnect.user.repository.EventBookmarkRepository;
import com.developersconnect.user.repository.EventPaymentRepository;
import com.developersconnect.user.repository.EventWithdrawalRepository;
import com.developersconnect.user.repository.MentorWalletRepository;
import com.developersconnect.user.repository.UserProfileRepository;

@Service
public class EventCommerceService {

    private static final double MENTOR_SHARE_RATIO = 0.60;

    private final CommunityEventRepository eventRepository;
    private final CommunityEventRegistrationRepository registrationRepository;
    private final EventPaymentRepository paymentRepository;
    private final MentorWalletRepository walletRepository;
    private final EventWithdrawalRepository withdrawalRepository;
    private final EventBookmarkRepository bookmarkRepository;
    private final UserProfileRepository userProfileRepository;
    private final PaymentVerificationService paymentVerificationService;
    private final EventNotificationService notificationService;

    public EventCommerceService(
        CommunityEventRepository eventRepository,
        CommunityEventRegistrationRepository registrationRepository,
        EventPaymentRepository paymentRepository,
        MentorWalletRepository walletRepository,
        EventWithdrawalRepository withdrawalRepository,
        EventBookmarkRepository bookmarkRepository,
        UserProfileRepository userProfileRepository,
        PaymentVerificationService paymentVerificationService,
        EventNotificationService notificationService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.paymentRepository = paymentRepository;
        this.walletRepository = walletRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.userProfileRepository = userProfileRepository;
        this.paymentVerificationService = paymentVerificationService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public EventStatsResponse getUserStats(UUID userId) {
        Instant now = Instant.now();
        long upcoming = eventRepository.findAllByStartsAtAfterOrderByStartsAtAsc(now, PageRequest.of(0, 500))
            .stream()
            .filter(event -> !event.isCancelled())
            .filter(this::isApproved)
            .count();
        long myRegistrations = registrationRepository.findAll().stream()
            .filter(reg -> reg.getUserId().equals(userId))
            .count();
        long online = eventRepository.findAllByStartsAtAfterOrderByStartsAtAsc(now, PageRequest.of(0, 500))
            .stream()
            .filter(event -> !event.isCancelled())
            .filter(this::isApproved)
            .filter(event -> "online".equalsIgnoreCase(event.getFormat()))
            .count();
        long past = eventRepository.findAllByStartsAtBeforeOrderByStartsAtDesc(now, PageRequest.of(0, 500))
            .stream()
            .filter(event -> !event.isCancelled())
            .count();
        return new EventStatsResponse(upcoming, myRegistrations, online, past);
    }

    @Transactional(readOnly = true)
    public List<PopularHostResponse> getPopularHosts(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        Map<UUID, HostAggregate> aggregates = new HashMap<>();
        for (CommunityEvent event : eventRepository.findAll()) {
            if (event.isCancelled() || !isApproved(event)) {
                continue;
            }
            HostAggregate agg = aggregates.computeIfAbsent(event.getHostId(), id -> new HostAggregate());
            agg.eventsHosted++;
            agg.totalRegistrations += registrationRepository.countByEventId(event.getId());
        }
        return aggregates.entrySet().stream()
            .sorted(Comparator.comparingLong((Map.Entry<UUID, HostAggregate> e) -> e.getValue().totalRegistrations).reversed())
            .limit(safeLimit)
            .map(entry -> toPopularHost(entry.getKey(), entry.getValue()))
            .toList();
    }

    @Transactional
    public void toggleBookmark(UUID eventId, UUID userId) {
        findEvent(eventId);
        if (bookmarkRepository.existsByEventIdAndUserId(eventId, userId)) {
            bookmarkRepository.deleteByEventIdAndUserId(eventId, userId);
            return;
        }
        EventBookmark bookmark = new EventBookmark();
        bookmark.setEventId(eventId);
        bookmark.setUserId(userId);
        bookmarkRepository.save(bookmark);
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(UUID eventId, UUID userId) {
        return bookmarkRepository.existsByEventIdAndUserId(eventId, userId);
    }

    @Transactional(readOnly = true)
    public List<CommunityEvent> listBookmarkedEvents(UUID userId) {
        return bookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(bookmark -> eventRepository.findById(bookmark.getEventId()).orElse(null))
            .filter(event -> event != null && !event.isCancelled())
            .toList();
    }

    public EventOrderResponse createPaymentOrder(UUID eventId, UUID userId) {
        CommunityEvent event = findApprovedEvent(eventId);
        if (!event.isPaid() || event.getPriceInrCents() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This event is free");
        }
        if (registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already registered");
        }
        return new EventOrderResponse(
            event.getPriceInrCents() / 100,
            "INR",
            "DevConnect — " + event.getTitle(),
            "event-" + eventId + "-" + userId,
            event.getPriceInrCents()
        );
    }

    @Transactional
    public void confirmPayment(UUID eventId, UUID userId, ConfirmEventPaymentRequest request) {
        CommunityEvent event = findApprovedEvent(eventId);
        if (!event.isPaid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This event is free");
        }
        UUID paymentId = request.paymentId();
        if (paymentRepository.existsByPaymentId(paymentId)) {
            return;
        }
        paymentVerificationService.verifyCompletedPurchase(
            userId,
            paymentId,
            event.getPriceInrCents(),
            "INR"
        );

        int mentorShare = (int) Math.round(event.getPriceInrCents() * MENTOR_SHARE_RATIO);
        int platformShare = event.getPriceInrCents() - mentorShare;

        EventPayment payment = new EventPayment();
        payment.setEventId(eventId);
        payment.setUserId(userId);
        payment.setMentorId(event.getHostId());
        payment.setPaymentId(paymentId);
        payment.setAmountCents(event.getPriceInrCents());
        payment.setMentorShareCents(mentorShare);
        payment.setPlatformShareCents(platformShare);
        payment.setStatus("completed");
        paymentRepository.save(payment);

        CommunityEventRegistration registration = new CommunityEventRegistration();
        registration.setEventId(eventId);
        registration.setUserId(userId);
        registration.setPaymentStatus("completed");
        registration.setAmountPaidCents(event.getPriceInrCents());
        registrationRepository.save(registration);

        creditMentorWallet(event.getHostId(), mentorShare);

        notificationService.notifyUser(
            userId,
            "Registration confirmed",
            "You successfully registered for " + event.getTitle(),
            "EVENT_REGISTRATION"
        );
        notificationService.notifyUser(
            event.getHostId(),
            "New registration",
            displayName(userProfileRepository.findById(userId).orElse(null)) + " registered for your event",
            "EVENT_REGISTRATION"
        );
    }

    @Transactional(readOnly = true)
    public EventRevenueAnalyticsResponse getRevenueAnalytics() {
        long totalCents = paymentRepository.sumCompletedAmountCents();
        long platformCents = paymentRepository.sumCompletedPlatformShareCents();
        long mentorCents = paymentRepository.sumCompletedMentorShareCents();
        long totalEvents = eventRepository.count();
        long approved = eventRepository.findAll().stream().filter(this::isApproved).count();
        long pending = eventRepository.findAll().stream()
            .filter(event -> "pending".equalsIgnoreCase(event.getHostApprovalStatus()))
            .count();
        long registrations = registrationRepository.count();
        long paidRegs = paymentRepository.countByStatus("completed");

        Map<String, Long> categoryCounts = new HashMap<>();
        for (CommunityEvent event : eventRepository.findAll()) {
            if (!event.isCancelled()) {
                categoryCounts.merge(event.getCategory(), 1L, Long::sum);
            }
        }
        List<EventCategoryStatResponse> topCategories = categoryCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(4)
            .map(e -> new EventCategoryStatResponse(e.getKey(), e.getValue()))
            .toList();

        List<EventPaymentSummaryResponse> recent = paymentRepository.findAll().stream()
            .sorted(Comparator.comparing(EventPayment::getCreatedAt).reversed())
            .limit(10)
            .map(this::toPaymentSummary)
            .toList();

        return new EventRevenueAnalyticsResponse(
            totalCents / 100,
            platformCents / 100,
            mentorCents / 100,
            totalEvents,
            approved,
            pending,
            registrations,
            paidRegs,
            recent,
            topCategories
        );
    }

    @Transactional(readOnly = true)
    public MentorEventDashboardResponse getMentorDashboard(UUID mentorId) {
        List<CommunityEvent> hosted = eventRepository.findAll().stream()
            .filter(event -> mentorId.equals(event.getHostId()))
            .toList();
        Instant now = Instant.now();
        long upcoming = hosted.stream().filter(e -> e.getStartsAt().isAfter(now) && !e.isCancelled()).count();
        long completed = hosted.stream().filter(e -> e.getEndsAt().isBefore(now) && !e.isCancelled()).count();
        long students = hosted.stream().mapToLong(e -> registrationRepository.countByEventId(e.getId())).sum();
        List<EventPayment> payments = paymentRepository.findAllByMentorIdOrderByCreatedAtDesc(mentorId);
        long totalRevenue = payments.stream().mapToInt(EventPayment::getAmountCents).sum();
        long mentorEarnings = payments.stream().mapToInt(EventPayment::getMentorShareCents).sum();
        long platformFee = payments.stream().mapToInt(EventPayment::getPlatformShareCents).sum();
        MentorWallet wallet = walletRepository.findById(mentorId).orElse(null);
        long available = wallet != null ? wallet.getAvailableBalanceCents() : 0;
        return new MentorEventDashboardResponse(
            hosted.size(),
            upcoming,
            completed,
            students,
            totalRevenue / 100,
            mentorEarnings / 100,
            platformFee / 100,
            available / 100
        );
    }

    @Transactional
    public void requestWithdrawal(UUID mentorId, int amountInr) {
        if (amountInr <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount");
        }
        MentorWallet wallet = walletRepository.findById(mentorId).orElse(null);
        int amountCents = amountInr * 100;
        if (wallet == null || wallet.getAvailableBalanceCents() < amountCents) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance");
        }
        wallet.setAvailableBalanceCents(wallet.getAvailableBalanceCents() - amountCents);
        walletRepository.save(wallet);

        EventWithdrawal withdrawal = new EventWithdrawal();
        withdrawal.setMentorId(mentorId);
        withdrawal.setAmountCents(amountCents);
        withdrawal.setStatus("pending");
        withdrawalRepository.save(withdrawal);
    }

    @Transactional
    public void approveWithdrawal(UUID withdrawalId) {
        EventWithdrawal withdrawal = withdrawalRepository.findById(withdrawalId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Withdrawal not found"));
        if (!"pending".equals(withdrawal.getStatus())) {
            return;
        }
        withdrawal.setStatus("approved");
        withdrawal.setResolvedAt(Instant.now());
        withdrawalRepository.save(withdrawal);

        MentorWallet wallet = walletRepository.findById(withdrawal.getMentorId()).orElseGet(() -> {
            MentorWallet created = new MentorWallet();
            created.setMentorId(withdrawal.getMentorId());
            return created;
        });
        wallet.setWithdrawnAmountCents(wallet.getWithdrawnAmountCents() + withdrawal.getAmountCents());
        walletRepository.save(wallet);
    }

    @Transactional
    public void rejectWithdrawal(UUID withdrawalId, String note) {
        EventWithdrawal withdrawal = withdrawalRepository.findById(withdrawalId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Withdrawal not found"));
        if (!"pending".equals(withdrawal.getStatus())) {
            return;
        }
        withdrawal.setStatus("rejected");
        withdrawal.setAdminNote(note);
        withdrawal.setResolvedAt(Instant.now());
        withdrawalRepository.save(withdrawal);

        walletRepository.findById(withdrawal.getMentorId()).ifPresent(wallet -> {
            wallet.setAvailableBalanceCents(wallet.getAvailableBalanceCents() + withdrawal.getAmountCents());
            walletRepository.save(wallet);
        });
    }

    private void creditMentorWallet(UUID mentorId, int mentorShareCents) {
        MentorWallet wallet = walletRepository.findById(mentorId).orElseGet(() -> {
            MentorWallet created = new MentorWallet();
            created.setMentorId(mentorId);
            return created;
        });
        wallet.setAvailableBalanceCents(wallet.getAvailableBalanceCents() + mentorShareCents);
        wallet.setTotalEarningCents(wallet.getTotalEarningCents() + mentorShareCents);
        walletRepository.save(wallet);
    }

    private EventPaymentSummaryResponse toPaymentSummary(EventPayment payment) {
        CommunityEvent event = eventRepository.findById(payment.getEventId()).orElse(null);
        UserProfile mentor = userProfileRepository.findById(payment.getMentorId()).orElse(null);
        long tickets = registrationRepository.countByEventId(payment.getEventId());
        return new EventPaymentSummaryResponse(
            payment.getId(),
            payment.getEventId(),
            event != null ? event.getTitle() : "Event",
            displayName(mentor),
            (int) tickets,
            payment.getAmountCents() / 100,
            payment.getMentorShareCents() / 100,
            payment.getPlatformShareCents() / 100,
            payment.getStatus(),
            payment.getCreatedAt()
        );
    }

    private PopularHostResponse toPopularHost(UUID hostId, HostAggregate aggregate) {
        UserProfile profile = userProfileRepository.findById(hostId).orElse(null);
        return new PopularHostResponse(
            hostId,
            displayName(profile),
            profile != null ? profile.getRole() : "Mentor",
            profile != null && profile.getBio() != null ? profile.getBio() : "DevConnect Mentor",
            4.8,
            aggregate.eventsHosted,
            aggregate.totalRegistrations,
            false
        );
    }

    private CommunityEvent findEvent(UUID eventId) {
        return eventRepository.findById(eventId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
    }

    private CommunityEvent findApprovedEvent(UUID eventId) {
        CommunityEvent event = findEvent(eventId);
        if (event.isCancelled() || !isApproved(event)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return event;
    }

    private boolean isApproved(CommunityEvent event) {
        return "approved".equalsIgnoreCase(event.getHostApprovalStatus());
    }

    private String displayName(UserProfile profile) {
        if (profile == null) {
            return "Developer";
        }
        if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName();
        }
        return profile.getUsername();
    }

    private static final class HostAggregate {
        private long eventsHosted;
        private long totalRegistrations;
    }
}
