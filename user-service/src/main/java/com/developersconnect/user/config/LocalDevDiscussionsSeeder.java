package com.developersconnect.user.config;

import com.developersconnect.user.model.DiscussionThread;
import com.developersconnect.user.repository.DiscussionThreadRepository;
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
@Order(30)
public class LocalDevDiscussionsSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevDiscussionsSeeder.class);

    private final DiscussionThreadRepository threadRepository;

    public LocalDevDiscussionsSeeder(DiscussionThreadRepository threadRepository) {
        this.threadRepository = threadRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (threadRepository.count() > 0) {
            return;
        }

        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "How to approach graph problems in interviews?",
            "I keep getting stuck on BFS/DFS variants during mock interviews. What's a good framework to recognize which approach to use quickly?",
            "interview-prep",
            Set.of("dsa", "graphs", "interviews")
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "Best practices for React Server Components in 2026?",
            "Our team is migrating from CRA to Next.js App Router. What pitfalls should we watch for with RSC and client boundaries?",
            "frontend",
            Set.of("react", "nextjs", "architecture")
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "Microservices vs modular monolith for early-stage startups?",
            "We're 5 engineers building a fintech MVP. Leadership wants microservices day one — I'd push back. Thoughts?",
            "architecture",
            Set.of("microservices", "system-design", "startup")
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "Transitioning from junior to mid-level — what actually matters?",
            "Hit 2 YOE recently. Beyond LeetCode, what skills helped you level up fastest?",
            "career",
            Set.of("career", "growth", "advice")
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "Spring Boot 3 + virtual threads — worth it in production?",
            "Has anyone run virtual threads with Spring Boot 3.3 in prod? Curious about observability and JDBC pool sizing.",
            "backend",
            Set.of("java", "spring", "performance")
        );

        log.info("Seeded {} local discussion threads", threadRepository.count());
    }

    private void seed(UUID authorId, String title, String content, String topic, Set<String> tags) {
        DiscussionThread thread = new DiscussionThread();
        thread.setAuthorId(authorId);
        thread.setTitle(title);
        thread.setContent(content);
        thread.setTopic(topic);
        thread.setTags(new LinkedHashSet<>(tags));
        threadRepository.save(thread);
    }
}
