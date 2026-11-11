package com.developersconnect.user.config;

import com.developersconnect.user.model.CommunityPost;
import com.developersconnect.user.model.PlatformReport;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityPostRepository;
import com.developersconnect.user.repository.PlatformReportRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repairs locally seeded reports so post targets and ban accounts point at real rows.
 */
@Component
@Profile("local")
@Order(31)
public class PlatformReportLinkageRepair implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformReportLinkageRepair.class);

    private final PlatformReportRepository reportRepository;
    private final CommunityPostRepository postRepository;
    private final UserProfileRepository userProfileRepository;

    public PlatformReportLinkageRepair(
        PlatformReportRepository reportRepository,
        CommunityPostRepository postRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.reportRepository = reportRepository;
        this.postRepository = postRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int linked = 0;
        for (PlatformReport report : reportRepository.findAll()) {
            if (linkPostTarget(report)) {
                linked++;
            }
            if (linkUserTarget(report)) {
                linked++;
            }
        }
        if (linked > 0) {
            log.info("Linked {} report target field(s) to community posts / user profiles", linked);
        }
    }

    private boolean linkPostTarget(PlatformReport report) {
        if (!"post".equals(report.getTargetType())) {
            return false;
        }
        boolean changed = false;
        Optional<CommunityPost> post = resolvePost(report);
        if (post.isEmpty()) {
            return false;
        }
        CommunityPost resolved = post.get();
        if (report.getTargetId() == null || !report.getTargetId().equals(resolved.getId())) {
            report.setTargetId(resolved.getId());
            changed = true;
        }
        if (report.getTargetAccountId() == null || !report.getTargetAccountId().equals(resolved.getAuthorId())) {
            report.setTargetAccountId(resolved.getAuthorId());
            changed = true;
        }
        if (changed) {
            reportRepository.save(report);
        }
        return changed;
    }

    private Optional<CommunityPost> resolvePost(PlatformReport report) {
        if (report.getTargetId() != null) {
            Optional<CommunityPost> byId = postRepository.findById(report.getTargetId());
            if (byId.isPresent()) {
                return byId;
            }
        }
        String summary = report.getTargetSummary();
        if (summary == null || summary.isBlank()) {
            return Optional.empty();
        }
        Optional<CommunityPost> exact = postRepository.findFirstByContentIgnoreCase(summary.trim());
        if (exact.isPresent()) {
            return exact;
        }
        return postRepository
            .findByContentContainingIgnoreCase(summary.trim(), org.springframework.data.domain.PageRequest.of(0, 1))
            .stream()
            .findFirst();
    }

    private boolean linkUserTarget(PlatformReport report) {
        if (!"user".equals(report.getTargetType()) || report.getTargetAccountId() != null) {
            return false;
        }
        String username = extractUsername(report.getTargetSummary());
        if (username == null) {
            return false;
        }
        Optional<UserProfile> profile = userProfileRepository.findByUsername(username);
        if (profile.isEmpty()) {
            return false;
        }
        report.setTargetAccountId(profile.get().getId());
        reportRepository.save(report);
        return true;
    }

    private String extractUsername(String summary) {
        if (summary == null || summary.isBlank()) {
            return null;
        }
        String trimmed = summary.trim();
        if (trimmed.startsWith("@")) {
            return trimmed.substring(1);
        }
        return trimmed;
    }
}
