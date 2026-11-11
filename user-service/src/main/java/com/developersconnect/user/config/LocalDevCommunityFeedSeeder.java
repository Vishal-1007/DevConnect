package com.developersconnect.user.config;

import com.developersconnect.user.model.CommunityPost;
import com.developersconnect.user.repository.CommunityPostRepository;
import java.util.LinkedHashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(20)
public class LocalDevCommunityFeedSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevCommunityFeedSeeder.class);

    private final CommunityPostRepository postRepository;

    public LocalDevCommunityFeedSeeder(CommunityPostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (postRepository.count() > 0) {
            return;
        }

        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "system-design",
            "Just finished a mock system design on URL shorteners with a mentee. Key takeaway: always clarify read/write ratio and retention before picking a storage layer.",
            Set.of("system-design", "mentorship", "backend")
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "frontend",
            "React 19 batching made a noticeable difference in our dashboard — cut unnecessary re-renders by ~40%. Happy to review anyone's profiler screenshots this week.",
            Set.of("react", "performance", "frontend")
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "career",
            "Interview tip: when stuck on a coding problem, narrate your thought process out loud. Interviewers care more about how you reason than a perfect optimal solution.",
            Set.of("interview-prep", "career", "dsa")
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "mentorship",
            "Looking for 2 mentees this week focused on Spring Boot microservices. Drop a comment if you're building something in Java — happy to do a free 30-min architecture review.",
            Set.of("java", "spring", "mentorship")
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "frontend",
            "Shipped a dark-mode design system for our team. Pro tip: define semantic tokens (surface, border, accent) instead of hard-coded hex values. Makes theming trivial.",
            Set.of("design-systems", "css", "ui")
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "general",
            "Weekly win thread 🎉 What did you ship or learn this week? I'll start: finally understood trie optimization for autocomplete.",
            Set.of("community", "learning")
        );
        seed(
            LocalDevDemoProfiles.SARAH_ID,
            "general",
            "Buy crypto now!!!",
            Set.of("spam")
        );
        seed(
            LocalDevDemoProfiles.MIKE_ID,
            "general",
            "Join my telegram channel",
            Set.of("spam")
        );
        seed(
            LocalDevDemoProfiles.RAHUL_ID,
            "general",
            "Offensive rant about juniors…",
            Set.of("abusive_language")
        );

        log.info("Seeded {} local community feed posts", postRepository.count());
    }

    private void seed(
        java.util.UUID authorId,
        String category,
        String content,
        Set<String> tags
    ) {
        CommunityPost post = new CommunityPost();
        post.setAuthorId(authorId);
        post.setCategory(category);
        post.setContent(content);
        post.setTags(new LinkedHashSet<>(tags));
        postRepository.save(post);
    }
}
