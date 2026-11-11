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
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures spam/abuse demo posts exist for report moderation even when the feed was seeded earlier.
 */
@Component
@Profile("local")
@Order(21)
public class CommunityFeedSpamPostRepair implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CommunityFeedSpamPostRepair.class);

    private final CommunityPostRepository postRepository;

    public CommunityFeedSpamPostRepair(CommunityPostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int added = 0;
        added += ensurePost(LocalDevDemoProfiles.SARAH_ID, "general", "Buy crypto now!!!", Set.of("spam"));
        added += ensurePost(LocalDevDemoProfiles.MIKE_ID, "general", "Join my telegram channel", Set.of("spam"));
        added += ensurePost(
            LocalDevDemoProfiles.RAHUL_ID,
            "general",
            "Offensive rant about juniors…",
            Set.of("abusive_language")
        );
        if (added > 0) {
            log.info("Added {} moderation demo post(s) to community feed", added);
        }
    }

    private int ensurePost(
        java.util.UUID authorId,
        String category,
        String content,
        Set<String> tags
    ) {
        if (postRepository.findFirstByContentIgnoreCase(content).isPresent()) {
            return 0;
        }
        CommunityPost post = new CommunityPost();
        post.setAuthorId(authorId);
        post.setCategory(category);
        post.setContent(content);
        post.setTags(new LinkedHashSet<>(tags));
        postRepository.save(post);
        return 1;
    }
}
