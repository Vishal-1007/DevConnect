package com.developersconnect.mentor.config;

import com.developersconnect.mentor.dto.CreateStreamCourseRequest;
import com.developersconnect.mentor.dto.CreateStreamLessonRequest;
import com.developersconnect.mentor.dto.CreateStreamSectionRequest;
import com.developersconnect.mentor.repository.LearningCourseRepository;
import com.developersconnect.mentor.service.LearningStreamsService;
import java.util.List;
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
public class LocalDevLearningStreamsSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevLearningStreamsSeeder.class);
    private static final UUID DEMO_MENTOR = UUID.fromString("11111111-1111-1111-1111-111111111101");

    private final LearningCourseRepository courseRepository;
    private final LearningStreamsService streamsService;

    public LocalDevLearningStreamsSeeder(
        LearningCourseRepository courseRepository,
        LearningStreamsService streamsService
    ) {
        this.courseRepository = courseRepository;
        this.streamsService = streamsService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (courseRepository.count() > 0) {
            return;
        }
        try {
            seedCourse("Spring Boot Masterclass", "PAID", 4999, 3499, "INTERMEDIATE",
                "java,spring-boot,backend", "https://images.unsplash.com/photo-1517694712202-14dd953757aa?w=640");
            seedCourse("React Performance Deep Dive", "FREE", 0, null, "ADVANCED",
                "react,frontend,performance", "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640");
            seedCourse("System Design Fundamentals", "PAID", 7999, 5999, "BEGINNER",
                "system-design,architecture", "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640");
            seedCourse("DSA Interview Patterns", "FREE", 0, null, "INTERMEDIATE",
                "dsa,interview,java", "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=640");
            log.info("Seeded demo learning stream courses");
        } catch (Exception ex) {
            log.warn("Could not seed learning streams: {}", ex.getMessage());
        }
    }

    private void seedCourse(
        String title, String pricing, int price, Integer discount, String difficulty,
        String tags, String thumb
    ) {
        var request = new CreateStreamCourseRequest(
            title,
            "Comprehensive mentorship course by DevConnect mentors.",
            "Programming",
            thumb,
            thumb,
            pricing,
            "INR",
            price,
            discount,
            difficulty,
            Set.of(tags.split(",")),
            "Build production-ready skills\nHands-on lessons\nInterview preparation",
            "Basic programming knowledge",
            List.of(
                new CreateStreamSectionRequest("Getting Started", 0, List.of(
                    new CreateStreamLessonRequest("Introduction", "https://www.w3schools.com/html/mov_bbb.mp4", 600, 0, true),
                    new CreateStreamLessonRequest("Setup & Tools", "https://www.w3schools.com/html/mov_bbb.mp4", 900, 1, false)
                )),
                new CreateStreamSectionRequest("Core Concepts", 1, List.of(
                    new CreateStreamLessonRequest("Deep Dive", "https://www.w3schools.com/html/mov_bbb.mp4", 1200, 0, false),
                    new CreateStreamLessonRequest("Best Practices", "https://www.w3schools.com/html/mov_bbb.mp4", 1500, 1, false)
                ))
            )
        );
        var card = streamsService.createCourse(DEMO_MENTOR, "Sarah Chen", request);
        streamsService.publishCourse(DEMO_MENTOR, card.id());
        var course = courseRepository.findById(card.id()).orElseThrow();
        course.setAverageRating(4.7);
        course.setRatingCount(128);
        course.setEnrolledCount(890);
        course.setLikeCount(340);
        courseRepository.save(course);
    }
}
