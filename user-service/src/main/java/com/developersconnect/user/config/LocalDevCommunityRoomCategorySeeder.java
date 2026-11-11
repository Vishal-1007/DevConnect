package com.developersconnect.user.config;

import com.developersconnect.user.model.CommunityRoomCategory;
import com.developersconnect.user.repository.CommunityRoomCategoryRepository;
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
@Order(54)
public class LocalDevCommunityRoomCategorySeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevCommunityRoomCategorySeeder.class);

    private final CommunityRoomCategoryRepository categoryRepository;

    public LocalDevCommunityRoomCategorySeeder(CommunityRoomCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() > 0) {
            return;
        }
        seed("java", "Java", "Java, Spring Boot, and JVM ecosystem", 1);
        seed("ai", "AI & ML", "Machine learning, LLMs, and AI tooling", 2);
        seed("startup", "Startup", "Founders, networking, and product building", 3);
        seed("backend", "Backend", "APIs, databases, and server-side patterns", 4);
        seed("frontend", "Frontend", "React, UI, and web performance", 5);
        seed("devops", "DevOps", "Cloud, Kubernetes, and CI/CD", 6);
        seed("career", "Career", "Jobs, portfolios, and growth", 7);
        seed("interview-prep", "Interview Prep", "DSA and mock interviews", 8);
        seed("architecture", "Architecture", "System design and scalability", 9);
        seed("general", "General", "Open community discussions", 10);
        log.info("Seeded {} community room categories", categoryRepository.count());
    }

    private void seed(String slug, String label, String description, int order) {
        if (categoryRepository.findBySlugIgnoreCase(slug).isPresent()) {
            return;
        }
        CommunityRoomCategory category = new CommunityRoomCategory();
        category.setSlug(slug);
        category.setLabel(label);
        category.setDescription(description);
        category.setDisplayOrder(order);
        category.setActive(true);
        categoryRepository.save(category);
    }
}
