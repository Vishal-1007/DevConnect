package com.developersconnect.mentor.config;

import com.developersconnect.mentor.dto.CreateInterviewQuestionSetRequest;
import com.developersconnect.mentor.model.MentorInterviewQuestion;
import com.developersconnect.mentor.repository.InterviewQuestionSetRepository;
import com.developersconnect.mentor.repository.MentorInterviewQuestionRepository;
import com.developersconnect.mentor.service.InterviewMarketplaceService;
import com.developersconnect.mentor.service.MentorInterviewQuestionSeedService;
import java.util.List;
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
@Order(55)
public class LocalDevInterviewMarketplaceSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevInterviewMarketplaceSeeder.class);
    private static final UUID DEMO_MENTOR = UUID.fromString("11111111-1111-1111-1111-111111111101");

    private final InterviewQuestionSetRepository setRepository;
    private final MentorInterviewQuestionRepository questionRepository;
    private final MentorInterviewQuestionSeedService questionSeedService;
    private final InterviewMarketplaceService marketplaceService;

    public LocalDevInterviewMarketplaceSeeder(
        InterviewQuestionSetRepository setRepository,
        MentorInterviewQuestionRepository questionRepository,
        MentorInterviewQuestionSeedService questionSeedService,
        InterviewMarketplaceService marketplaceService
    ) {
        this.setRepository = setRepository;
        this.questionRepository = questionRepository;
        this.questionSeedService = questionSeedService;
        this.marketplaceService = marketplaceService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (setRepository.countByDeletedAtIsNullAndStatusAndVisibilityIn(
            "PUBLISHED", List.of("PUBLIC_FREE", "PUBLIC_PAID")) > 0) {
            return;
        }
        try {
            questionSeedService.ensurePlatformLibrary();
            List<UUID> questionIds = questionRepository.findByMentorIdIsNullOrderByCategoryAscDifficultyAsc()
                .stream()
                .limit(5)
                .map(MentorInterviewQuestion::getId)
                .toList();
            if (questionIds.size() < 3) {
                log.warn("Skipping interview marketplace seed — not enough platform questions");
                return;
            }

            marketplaceService.createPack(DEMO_MENTOR, new CreateInterviewQuestionSetRequest(
                "Java Backend Interview Master Pack",
                "50 curated backend interview questions covering Java, Spring Boot, and system design fundamentals.",
                "Answer each question thoroughly. Use the code editor for implementation questions.",
                90,
                "medium",
                "https://images.unsplash.com/photo-1517694712202-14dd953757aa?w=640",
                "java,spring_boot,backend",
                "PUBLIC_FREE",
                0,
                "INR",
                null,
                questionIds,
                null,
                null,
                true
            ));

            marketplaceService.createPack(DEMO_MENTOR, new CreateInterviewQuestionSetRequest(
                "DSA Interview Premium Pack",
                "Premium data structures and algorithms questions with detailed evaluation rubrics.",
                "Focus on optimal time/space complexity and clear communication.",
                120,
                "hard",
                "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=640",
                "dsa,algorithms,interview",
                "PUBLIC_PAID",
                29900,
                "INR",
                30,
                questionIds,
                null,
                null,
                true
            ));

            log.info("Seeded demo interview marketplace packs for mentor {}", DEMO_MENTOR);
        } catch (Exception ex) {
            log.warn("Could not seed interview marketplace packs: {}", ex.getMessage());
        }
    }
}
