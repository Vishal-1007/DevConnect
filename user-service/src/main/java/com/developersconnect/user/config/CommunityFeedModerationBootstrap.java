package com.developersconnect.user.config;

import com.developersconnect.user.model.CommunityPost;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.service.ContentModerationScanner;
import com.developersconnect.user.service.ContentModerationScanner.ModerationScanResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@Order(22)
public class CommunityFeedModerationBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CommunityFeedModerationBootstrap.class);

    private final CommunityPostRepository postRepository;
    private final ContentModerationScanner moderationScanner;

    public CommunityFeedModerationBootstrap(
        CommunityPostRepository postRepository,
        ContentModerationScanner moderationScanner
    ) {
        this.postRepository = postRepository;
        this.moderationScanner = moderationScanner;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int flagged = 0;
        for (CommunityPost post : postRepository.findAll()) {
            if (post.isFlagged() && !post.getModerationFlags().isEmpty()) {
                continue;
            }
            ModerationScanResult result = moderationScanner.scan(post.getContent());
            if (result.flagged()) {
                moderationScanner.applyScanResult(post, result);
                postRepository.save(post);
                flagged++;
            }
        }
        if (flagged > 0) {
            log.info("AI moderation auto-flagged {} community post(s)", flagged);
        }
    }
}
