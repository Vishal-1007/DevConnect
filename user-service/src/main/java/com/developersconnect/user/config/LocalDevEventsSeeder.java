package com.developersconnect.user.config;

import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.repository.CommunityEventRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(50)
public class LocalDevEventsSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevEventsSeeder.class);

    private final CommunityEventRepository eventRepository;

    public LocalDevEventsSeeder(CommunityEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (eventRepository.count() > 0) {
            return;
        }

        Instant now = Instant.now();

        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "Spring Boot Microservices Masterclass",
            "Paid masterclass on building production-ready microservices with Spring Boot, Kafka, and observability.",
            "workshop", "java", "online", "https://meet.devconnect.local/spring-boot",
            now.plus(2, ChronoUnit.DAYS), now.plus(2, ChronoUnit.DAYS).plus(120, ChronoUnit.MINUTES),
            100, Set.of("java", "spring", "microservices"),
            null, "approved", null,
            true, 499,
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop"
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "React Performance Deep Dive",
            "Live workshop on profiling, memoization, and concurrent rendering patterns in React 19.",
            "workshop", "frontend", "online", "https://meet.devconnect.local/react-perf",
            now.plus(2, ChronoUnit.DAYS).plus(6, ChronoUnit.HOURS),
            now.plus(2, ChronoUnit.DAYS).plus(6, ChronoUnit.HOURS).plus(90, ChronoUnit.MINUTES),
            50, Set.of("react", "performance", "frontend"),
            null, "approved", null,
            false, 0,
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop"
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "System Design Mock: Food Delivery at Scale",
            "Interactive webinar walking through capacity planning, sharding, and cache strategy for a Swiggy-scale system.",
            "webinar", "architecture", "online", "https://meet.devconnect.local/system-design",
            now.plus(4, ChronoUnit.DAYS), now.plus(4, ChronoUnit.DAYS).plus(120, ChronoUnit.MINUTES),
            200, Set.of("system-design", "backend", "scaling"),
            "mentor", "approved", "scheduled"
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "Weekend DSA Hackathon",
            "48-hour virtual hackathon focused on graph and dynamic programming challenges with live mentor office hours.",
            "hackathon", "interview-prep", "online", "https://devconnect.local/hackathon",
            now.plus(7, ChronoUnit.DAYS), now.plus(9, ChronoUnit.DAYS),
            150, Set.of("dsa", "hackathon", "competition"),
            null, null, null
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "Bangalore Backend Meetup",
            "In-person meetup on microservices observability — talks, networking, and lightning demos.",
            "meetup", "backend", "in-person", "Indiranagar, Bangalore",
            now.plus(10, ChronoUnit.DAYS), now.plus(10, ChronoUnit.DAYS).plus(180, ChronoUnit.MINUTES),
            40, Set.of("java", "spring", "networking"),
            null, null, null
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "Career AMA: Breaking into Big Tech",
            "Open Q&A on referrals, portfolio projects, and negotiation — bring your questions.",
            "webinar", "career", "online", "https://meet.devconnect.local/career-ama",
            now.plus(1, ChronoUnit.DAYS), now.plus(1, ChronoUnit.DAYS).plus(60, ChronoUnit.MINUTES),
            300, Set.of("career", "interviews", "ama"),
            "company", "approved", "scheduled"
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "Live Coding: Build a Rate Limiter",
            "Hands-on live coding stream implementing token bucket and sliding window rate limiters in Java.",
            "webinar", "backend", "online", "https://stream.devconnect.local/live-coding",
            now.plus(3, ChronoUnit.DAYS), now.plus(3, ChronoUnit.DAYS).plus(90, ChronoUnit.MINUTES),
            500, Set.of("java", "live-coding", "backend"),
            "live_coding", "pending", "scheduled"
        );

        log.info("Seeded {} local community events", eventRepository.count());
    }

    private void seed(
        UUID hostId,
        String title,
        String description,
        String eventType,
        String category,
        String format,
        String locationOrLink,
        Instant startsAt,
        Instant endsAt,
        int maxAttendees,
        Set<String> tags,
        String subtype,
        String approval,
        String stream
    ) {
        seed(hostId, title, description, eventType, category, format, locationOrLink,
            startsAt, endsAt, maxAttendees, tags, subtype, approval, stream, false, 0, null);
    }

    private void seed(
        UUID hostId,
        String title,
        String description,
        String eventType,
        String category,
        String format,
        String locationOrLink,
        Instant startsAt,
        Instant endsAt,
        int maxAttendees,
        Set<String> tags,
        String subtype,
        String approval,
        String stream,
        boolean paid,
        int priceInr,
        String thumbnailUrl
    ) {
        CommunityEvent event = new CommunityEvent();
        event.setHostId(hostId);
        event.setTitle(title);
        event.setDescription(description);
        event.setEventType(eventType);
        event.setCategory(category);
        event.setFormat(format);
        event.setLocationOrLink(locationOrLink);
        event.setStartsAt(startsAt);
        event.setEndsAt(endsAt);
        event.setMaxAttendees(maxAttendees);
        event.setTags(new LinkedHashSet<>(tags));
        event.setHostApprovalStatus(approval != null ? approval : "approved");
        event.setPaid(paid);
        if (paid && priceInr > 0) {
            event.setPriceInrCents(priceInr * 100);
        }
        if (thumbnailUrl != null) {
            event.setThumbnailUrl(thumbnailUrl);
        }
        if ("webinar".equals(eventType)) {
            event.setWebinarSubtype(subtype != null ? subtype : "mentor");
            event.setStreamStatus(stream != null ? stream : "scheduled");
        }
        eventRepository.save(event);
    }
}
