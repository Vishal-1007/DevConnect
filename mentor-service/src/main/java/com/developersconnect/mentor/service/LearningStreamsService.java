package com.developersconnect.mentor.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.mentor.dto.CourseProgressResponse;
import com.developersconnect.mentor.dto.CreateStreamCourseRequest;
import com.developersconnect.mentor.dto.CreateStreamLessonRequest;
import com.developersconnect.mentor.dto.CreateStreamSectionRequest;
import com.developersconnect.mentor.dto.LessonProgressResponse;
import com.developersconnect.mentor.dto.ResumePlaybackResponse;
import com.developersconnect.mentor.dto.StreamAnalyticsResponse;
import com.developersconnect.mentor.dto.StreamCheckoutInfoResponse;
import com.developersconnect.mentor.dto.StreamCourseCardResponse;
import com.developersconnect.mentor.dto.StreamCourseDetailResponse;
import com.developersconnect.mentor.dto.StreamLessonResponse;
import com.developersconnect.mentor.dto.StreamPageResponse;
import com.developersconnect.mentor.dto.StreamReviewResponse;
import com.developersconnect.mentor.dto.StreamSectionResponse;
import com.developersconnect.mentor.model.CoursePurchase;
import com.developersconnect.mentor.model.LearningCourse;
import com.developersconnect.mentor.model.LearningCourseSection;
import com.developersconnect.mentor.model.LearningLesson;
import com.developersconnect.mentor.model.MentorFollower;
import com.developersconnect.mentor.model.SavedCourse;
import com.developersconnect.mentor.model.StreamCartItem;
import com.developersconnect.mentor.model.WatchProgress;
import com.developersconnect.mentor.repository.CoursePurchaseRepository;
import com.developersconnect.mentor.repository.CourseReviewRepository;
import com.developersconnect.mentor.repository.LearningCourseRepository;
import com.developersconnect.mentor.repository.LearningCourseSectionRepository;
import com.developersconnect.mentor.repository.LearningLessonRepository;
import com.developersconnect.mentor.repository.MentorFollowerRepository;
import com.developersconnect.mentor.repository.SavedCourseRepository;
import com.developersconnect.mentor.repository.StreamCartItemRepository;
import com.developersconnect.mentor.repository.WatchProgressRepository;

@Service
public class LearningStreamsService {

    private static final String PUBLISHED = "PUBLISHED";
    private static final String COMPLETED = "COMPLETED";

    private final LearningCourseRepository courseRepository;
    private final LearningCourseSectionRepository sectionRepository;
    private final LearningLessonRepository lessonRepository;
    private final MentorFollowerRepository followerRepository;
    private final CoursePurchaseRepository purchaseRepository;
    private final StreamCartItemRepository cartRepository;
    private final SavedCourseRepository savedRepository;
    private final CourseReviewRepository reviewRepository;
    private final WatchProgressRepository progressRepository;
    private final StreamMediaStorageService mediaStorageService;
    private final PaymentVerificationService paymentVerificationService;
    private final ContentNotificationService contentNotificationService;

    public LearningStreamsService(
        LearningCourseRepository courseRepository,
        LearningCourseSectionRepository sectionRepository,
        LearningLessonRepository lessonRepository,
        MentorFollowerRepository followerRepository,
        CoursePurchaseRepository purchaseRepository,
        StreamCartItemRepository cartRepository,
        SavedCourseRepository savedRepository,
        CourseReviewRepository reviewRepository,
        WatchProgressRepository progressRepository,
        StreamMediaStorageService mediaStorageService,
        PaymentVerificationService paymentVerificationService,
        ContentNotificationService notificationService
    ) {
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.lessonRepository = lessonRepository;
        this.followerRepository = followerRepository;
        this.purchaseRepository = purchaseRepository;
        this.cartRepository = cartRepository;
        this.savedRepository = savedRepository;
        this.reviewRepository = reviewRepository;
        this.progressRepository = progressRepository;
        this.mediaStorageService = mediaStorageService;
        this.paymentVerificationService = paymentVerificationService;
        this.contentNotificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public StreamPageResponse<StreamCourseCardResponse> browse(
        UUID learnerId, String search, String pricingType, String difficulty, String sort, int page, int size
    ) {
        PageRequest pageable = pageRequest(page, size, sort);
        Page<LearningCourse> result;
        if (search != null && !search.isBlank() || pricingType != null || difficulty != null) {
            result = courseRepository.searchPublished(
                blankToNull(pricingType), blankToNull(difficulty), blankToNull(search), pageable
            );
        } else if ("trending".equalsIgnoreCase(sort)) {
            result = courseRepository.findTrending(pageable);
        } else {
            result = courseRepository.findByStatusOrderByPublishedAtDesc(PUBLISHED, pageable);
        }
        return toPage(result, learnerId);
    }

    @Transactional(readOnly = true)
    public StreamPageResponse<StreamCourseCardResponse> followed(UUID learnerId, int page, int size) {
        List<UUID> mentorIds = followerRepository.findFollowedMentorIds(learnerId);
        if (mentorIds.isEmpty()) {
            return new StreamPageResponse<>(List.of(), page, size, 0, false);
        }
        Page<LearningCourse> result = courseRepository.findPublishedByMentorIds(
            mentorIds, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"))
        );
        return toPage(result, learnerId);
    }

    @Transactional(readOnly = true)
    public StreamPageResponse<StreamCourseCardResponse> recommended(UUID learnerId, int page, int size) {
        List<UUID> followed = followerRepository.findFollowedMentorIds(learnerId);
        List<UUID> purchased = purchaseRepository.findByLearnerIdOrderByPurchasedAtDesc(learnerId).stream()
            .map(CoursePurchase::getCourseId).toList();
        Set<String> interestTags = new HashSet<>();
        for (UUID courseId : purchased) {
            courseRepository.findById(courseId).ifPresent(c -> interestTags.addAll(parseTags(c.getTags())));
        }
        Page<LearningCourse> trending = courseRepository.findTrending(PageRequest.of(0, 50));
        List<LearningCourse> ranked = trending.getContent().stream()
            .sorted(Comparator.comparingDouble((LearningCourse c) -> scoreCourse(c, followed, interestTags)).reversed())
            .toList();
        int from = Math.min(page * size, ranked.size());
        int to = Math.min(from + size, ranked.size());
        List<StreamCourseCardResponse> slice = ranked.subList(from, to).stream()
            .map(c -> toCard(c, learnerId)).toList();
        return new StreamPageResponse<>(slice, page, size, ranked.size(), to < ranked.size());
    }

    @Transactional(readOnly = true)
    public StreamCourseDetailResponse getCourseDetail(UUID learnerId, UUID courseId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!PUBLISHED.equals(course.getStatus()) && !course.getMentorId().equals(learnerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        boolean purchased = hasAccess(learnerId, course);
        boolean following = followerRepository.existsByIdMentorIdAndIdLearnerId(course.getMentorId(), learnerId);
        boolean saved = savedRepository.existsByIdLearnerIdAndIdCourseId(learnerId, courseId);
        Map<UUID, WatchProgress> progressMap = progressRepository.findByLearnerIdAndCourseId(learnerId, courseId)
            .stream().collect(Collectors.toMap(WatchProgress::getLessonId, p -> p));

        List<StreamSectionResponse> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId).stream()
            .map(section -> {
                List<StreamLessonResponse> lessons = lessonRepository.findBySectionIdOrderBySortOrderAsc(section.getId())
                    .stream()
                    .map(lesson -> toLesson(lesson, course, purchased, progressMap.get(lesson.getId())))
                    .toList();
                return new StreamSectionResponse(section.getId(), section.getTitle(), section.getSortOrder(), lessons);
            }).toList();

        List<StreamReviewResponse> reviews = reviewRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
            .limit(20)
            .map(r -> new StreamReviewResponse(r.getId(), r.getLearnerId(), r.getLearnerDisplayName(),
                r.getRating(), r.getComment(), r.getCreatedAt()))
            .toList();

        Page<LearningCourse> related = courseRepository.searchPublished(
            null, course.getDifficulty(), null, PageRequest.of(0, 4)
        );
        List<StreamCourseCardResponse> relatedCards = related.getContent().stream()
            .filter(c -> !c.getId().equals(courseId))
            .limit(3)
            .map(c -> toCard(c, learnerId))
            .toList();

        return new StreamCourseDetailResponse(
            course.getId(),
            course.getMentorId(),
            course.getMentorDisplayName(),
            course.getCreatorType(),
            course.getCategory(),
            course.getTitle(),
            course.getDescription(),
            course.getThumbnailUrl(),
            course.getBannerUrl(),
            course.getPricingType(),
            course.getCurrency(),
            course.getPriceCents(),
            course.getDiscountPriceCents(),
            course.getDifficulty(),
            parseTags(course.getTags()),
            (int) lessonRepository.countByCourseId(courseId),
            course.getWhatYouLearn(),
            course.getRequirements(),
            course.getAverageRating(),
            course.getRatingCount(),
            course.getEnrolledCount(),
            course.getTotalDurationSeconds(),
            course.getPublishedAt(),
            purchased,
            saved,
            following,
            sections,
            reviews,
            relatedCards
        );
    }

    @Transactional(readOnly = true)
    public StreamPageResponse<StreamCourseCardResponse> purchased(UUID learnerId, int page, int size) {
        List<UUID> courseIds = purchaseRepository.findPurchasedCourseIds(learnerId);
        if (courseIds.isEmpty()) {
            return new StreamPageResponse<>(List.of(), page, size, 0, false);
        }
        List<LearningCourse> paidPurchased = courseIds.stream()
            .map(courseRepository::findById)
            .filter(opt -> opt.isPresent())
            .map(opt -> opt.get())
            .filter(c -> "PAID".equals(c.getPricingType()))
            .toList();
        int from = Math.min(page * size, paidPurchased.size());
        int to = Math.min(from + size, paidPurchased.size());
        List<StreamCourseCardResponse> slice = paidPurchased.subList(from, to).stream()
            .map(c -> toCard(c, learnerId))
            .toList();
        return new StreamPageResponse<>(slice, page, size, paidPurchased.size(), to < paidPurchased.size());
    }

    @Transactional(readOnly = true)
    public StreamAnalyticsResponse analytics(UUID creatorId) {
        long totalCourses = courseRepository.countByMentorId(creatorId);
        long publishedCourses = courseRepository.countByMentorIdAndStatus(creatorId, PUBLISHED);
        long enrollments = purchaseRepository.countEnrollmentsByCreator(creatorId);
        long revenueCents = purchaseRepository.sumRevenueCentsByCreator(creatorId);
        long watchTime = progressRepository.sumWatchTimeSecondsByCreator(creatorId);
        long views = progressRepository.countViewsByCreator(creatorId);
        return new StreamAnalyticsResponse(
            totalCourses, publishedCourses, enrollments, revenueCents, watchTime, views
        );
    }

    @Transactional
    public StreamCourseCardResponse createCourse(UUID mentorId, String mentorName, CreateStreamCourseRequest request) {
        LearningCourse course = new LearningCourse();
        course.setMentorId(mentorId);
        course.setMentorDisplayName(mentorName);
        course.setCreatorType("MENTOR");
        applyCourseFields(course, request);
        course.setStatus("DRAFT");
        LearningCourse saved = courseRepository.save(course);
        saveSections(saved.getId(), request.sections());
        recalcDuration(saved.getId());
        return toCard(courseRepository.findById(saved.getId()).orElse(saved), mentorId);
    }

    @Transactional
    public StreamCourseCardResponse createAdminCourse(UUID adminId, String adminName, CreateStreamCourseRequest request) {
        LearningCourse course = new LearningCourse();
        course.setMentorId(adminId);
        course.setMentorDisplayName(adminName);
        course.setCreatorType("ADMIN");
        applyCourseFields(course, request);
        course.setStatus("DRAFT");
        LearningCourse saved = courseRepository.save(course);
        saveSections(saved.getId(), request.sections());
        recalcDuration(saved.getId());
        return toCard(courseRepository.findById(saved.getId()).orElse(saved), adminId);
    }

    @Transactional
    public StreamCourseCardResponse updateCourse(UUID mentorId, UUID courseId, CreateStreamCourseRequest request) {
        LearningCourse course = ownedCourse(mentorId, courseId);
        applyCourseFields(course, request);
        courseRepository.save(course);
        if (request.sections() != null) {
            lessonRepository.deleteByCourseId(courseId);
            sectionRepository.deleteByCourseId(courseId);
            saveSections(courseId, request.sections());
            recalcDuration(courseId);
        }
        return toCard(courseRepository.findById(courseId).orElse(course), mentorId);
    }

    @Transactional
    public StreamCourseCardResponse publishCourse(UUID mentorId, UUID courseId) {
        LearningCourse course = ownedCourse(mentorId, courseId);
        course.setStatus(PUBLISHED);
        course.setPublishedAt(Instant.now());
        courseRepository.save(course);
        contentNotificationService.notifyLearningStreamPublished(course.getTitle(), mentorId);
        return toCard(course, mentorId);
    }

    @Transactional
    public void deleteCourse(UUID mentorId, UUID courseId) {
        ownedCourse(mentorId, courseId);
        lessonRepository.deleteByCourseId(courseId);
        sectionRepository.deleteByCourseId(courseId);
        courseRepository.deleteById(courseId);
    }

    @Transactional
    public StreamSectionResponse createSection(UUID mentorId, UUID courseId, String title, int sortOrder) {
        ownedCourse(mentorId, courseId);
        LearningCourseSection section = new LearningCourseSection();
        section.setCourseId(courseId);
        section.setTitle(title);
        section.setSortOrder(sortOrder);
        LearningCourseSection saved = sectionRepository.save(section);
        return new StreamSectionResponse(saved.getId(), saved.getTitle(), saved.getSortOrder(), List.of());
    }

    @Transactional
    public StreamLessonResponse uploadLesson(
        UUID mentorId,
        UUID courseId,
        UUID sectionId,
        String title,
        String description,
        int durationSeconds,
        int sortOrder,
        boolean previewFree,
        MultipartFile video,
        MultipartFile thumbnail
    ) {
        LearningCourse course = ownedCourse(mentorId, courseId);
        LearningCourseSection section = sectionRepository.findById(sectionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        if (!section.getCourseId().equals(courseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section does not belong to course");
        }

        String storedVideo = mediaStorageService.storeVideo(video);
        String storedThumbnail = mediaStorageService.storeThumbnail(thumbnail);

        LearningLesson lesson = new LearningLesson();
        lesson.setCourseId(courseId);
        lesson.setSectionId(sectionId);
        lesson.setTitle(title);
        lesson.setDescription(description);
        lesson.setVideoUrl(storedVideo);
        lesson.setThumbnailUrl(storedThumbnail);
        lesson.setDurationSeconds(Math.max(durationSeconds, 0));
        lesson.setSortOrder(sortOrder);
        lesson.setPreviewFree(previewFree);
        LearningLesson saved = lessonRepository.save(lesson);
        recalcDuration(courseId);
        return toLesson(saved, course, true, null);
    }

    @Transactional(readOnly = true)
    public StreamCourseDetailResponse getMentorCourseDetail(UUID mentorId, UUID courseId) {
        ownedCourse(mentorId, courseId);
        return getCourseDetail(mentorId, courseId);
    }

    @Transactional(readOnly = true)
    public List<StreamCourseCardResponse> mentorCourses(UUID mentorId) {
        return courseRepository.findByMentorIdOrderByUpdatedAtDesc(mentorId).stream()
            .filter(c -> "MENTOR".equals(c.getCreatorType()))
            .map(c -> toCard(c, mentorId)).toList();
    }

    @Transactional(readOnly = true)
    public List<StreamCourseCardResponse> adminCourses(UUID adminId) {
        return courseRepository.findByMentorIdOrderByUpdatedAtDesc(adminId).stream()
            .filter(c -> "ADMIN".equals(c.getCreatorType()))
            .map(c -> toCard(c, adminId)).toList();
    }

    @Transactional(readOnly = true)
    public StreamCourseDetailResponse getAdminCourseDetail(UUID adminId, UUID courseId) {
        ownedAdminCourse(adminId, courseId);
        return getCourseDetail(adminId, courseId);
    }

    @Transactional
    public void followMentor(UUID learnerId, UUID mentorId) {
        if (learnerId.equals(mentorId)) return;
        if (followerRepository.existsByIdMentorIdAndIdLearnerId(mentorId, learnerId)) return;
        MentorFollower follower = new MentorFollower();
        follower.setId(new MentorFollower.Id(mentorId, learnerId));
        followerRepository.save(follower);
    }

    @Transactional
    public void unfollowMentor(UUID learnerId, UUID mentorId) {
        followerRepository.deleteById(new MentorFollower.Id(mentorId, learnerId));
    }

    @Transactional
    public void addToCart(UUID learnerId, UUID courseId) {
        courseRepository.findById(courseId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (cartRepository.findByLearnerIdAndCourseId(learnerId, courseId).isPresent()) return;
        StreamCartItem item = new StreamCartItem();
        item.setLearnerId(learnerId);
        item.setCourseId(courseId);
        cartRepository.save(item);
    }

    @Transactional
    public void removeFromCart(UUID learnerId, UUID courseId) {
        cartRepository.deleteByLearnerIdAndCourseId(learnerId, courseId);
    }

    @Transactional(readOnly = true)
    public List<StreamCourseCardResponse> getCart(UUID learnerId) {
        return cartRepository.findByLearnerIdOrderByAddedAtDesc(learnerId).stream()
            .map(item -> courseRepository.findById(item.getCourseId()).orElse(null))
            .filter(c -> c != null)
            .map(c -> toCard(c, learnerId))
            .toList();
    }

    @Transactional
    public void saveCourse(UUID learnerId, UUID courseId) {
        if (savedRepository.existsByIdLearnerIdAndIdCourseId(learnerId, courseId)) return;
        SavedCourse saved = new SavedCourse();
        saved.setId(new SavedCourse.Id(learnerId, courseId));
        savedRepository.save(saved);
    }

    @Transactional
    public void unsaveCourse(UUID learnerId, UUID courseId) {
        savedRepository.deleteById(new SavedCourse.Id(learnerId, courseId));
    }

    @Transactional(readOnly = true)
    public StreamCheckoutInfoResponse checkoutInfo(UUID learnerId, UUID courseId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if ("FREE".equals(course.getPricingType()) || hasAccess(learnerId, course)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is already accessible");
        }
        int amount = course.getDiscountPriceCents() != null ? course.getDiscountPriceCents() : course.getPriceCents();
        String currency = course.getCurrency() != null ? course.getCurrency() : "INR";
        return new StreamCheckoutInfoResponse(
            courseId, course.getTitle(), amount, currency,
            "DevConnect course: " + course.getTitle()
        );
    }

    @Transactional
    public StreamCourseCardResponse confirmPurchase(UUID learnerId, UUID courseId, UUID paymentId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (hasAccess(learnerId, course)) {
            return toCard(course, learnerId);
        }
        int amount = course.getDiscountPriceCents() != null ? course.getDiscountPriceCents() : course.getPriceCents();
        String currency = course.getCurrency() != null ? course.getCurrency() : "INR";
        paymentVerificationService.verifyCompletedPurchase(learnerId, paymentId, amount, currency);
        CoursePurchase purchase = new CoursePurchase();
        purchase.setCourseId(courseId);
        purchase.setLearnerId(learnerId);
        purchase.setPaymentId(paymentId);
        purchase.setAmountCents(amount);
        purchase.setStatus(COMPLETED);
        purchaseRepository.save(purchase);
        course.setEnrolledCount(course.getEnrolledCount() + 1);
        courseRepository.save(course);
        cartRepository.deleteByLearnerIdAndCourseId(learnerId, courseId);
        return toCard(course, learnerId);
    }

    /** Free enrollment for free courses */
    @Transactional
    public StreamCourseCardResponse enrollFree(UUID learnerId, UUID courseId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!"FREE".equals(course.getPricingType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course is not free");
        }
        if (!hasAccess(learnerId, course)) {
            CoursePurchase purchase = new CoursePurchase();
            purchase.setCourseId(courseId);
            purchase.setLearnerId(learnerId);
            purchase.setAmountCents(0);
            purchase.setStatus(COMPLETED);
            purchaseRepository.save(purchase);
            course.setEnrolledCount(course.getEnrolledCount() + 1);
            courseRepository.save(course);
        }
        return toCard(courseRepository.findById(courseId).orElse(course), learnerId);
    }

    @Transactional
    public LessonProgressResponse saveProgress(
        UUID learnerId, UUID lessonId, int progressSeconds, boolean completed, Integer watchedDurationSeconds
    ) {
        LearningLesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        LearningCourse course = courseRepository.findById(lesson.getCourseId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!hasAccess(learnerId, course) && !lesson.isPreviewFree()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Purchase required");
        }
        WatchProgress progress = progressRepository.findByLearnerIdAndLessonId(learnerId, lessonId)
            .orElseGet(() -> {
                WatchProgress p = new WatchProgress();
                p.setLearnerId(learnerId);
                p.setCourseId(lesson.getCourseId());
                p.setLessonId(lessonId);
                return p;
            });
        progress.setProgressSeconds(Math.max(0, progressSeconds));
        if (watchedDurationSeconds != null) {
            progress.setWatchedDurationSeconds(Math.max(progress.getWatchedDurationSeconds(), watchedDurationSeconds));
        }
        boolean autoComplete = isLessonComplete(lesson, progressSeconds);
        progress.setCompleted(progress.isCompleted() || completed || autoComplete);
        progressRepository.save(progress);
        return new LessonProgressResponse(
            lessonId,
            lesson.getCourseId(),
            progress.getProgressSeconds(),
            progress.getWatchedDurationSeconds(),
            progress.isCompleted(),
            calcWatchPercent(learnerId, lesson.getCourseId())
        );
    }

    @Transactional
    public LessonProgressResponse markLessonCompleted(UUID learnerId, UUID lessonId) {
        LearningLesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        LearningCourse course = courseRepository.findById(lesson.getCourseId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!hasAccess(learnerId, course) && !lesson.isPreviewFree()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Purchase required");
        }
        WatchProgress progress = progressRepository.findByLearnerIdAndLessonId(learnerId, lessonId)
            .orElseGet(() -> {
                WatchProgress p = new WatchProgress();
                p.setLearnerId(learnerId);
                p.setCourseId(lesson.getCourseId());
                p.setLessonId(lessonId);
                p.setProgressSeconds(lesson.getDurationSeconds());
                return p;
            });
        progress.setCompleted(true);
        if (progress.getProgressSeconds() < lesson.getDurationSeconds()) {
            progress.setProgressSeconds(lesson.getDurationSeconds());
        }
        progressRepository.save(progress);
        return new LessonProgressResponse(
            lessonId,
            lesson.getCourseId(),
            progress.getProgressSeconds(),
            progress.getWatchedDurationSeconds(),
            true,
            calcWatchPercent(learnerId, lesson.getCourseId())
        );
    }

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(UUID learnerId, UUID courseId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        List<LearningLesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        List<WatchProgress> progressRows = progressRepository.findByLearnerIdAndCourseId(learnerId, courseId);
        long completed = progressRows.stream().filter(WatchProgress::isCompleted).count();
        int total = lessons.size();
        int percent = total == 0 ? 0 : (int) ((completed * 100) / total);

        WatchProgress last = progressRepository
            .findFirstByLearnerIdAndCourseIdOrderByUpdatedAtDesc(learnerId, courseId)
            .orElse(null);
        UUID lastLessonId = null;
        String lastLessonTitle = null;
        int lastProgressSeconds = 0;
        Instant lastWatchedAt = null;
        if (last != null) {
            lastLessonId = last.getLessonId();
            lastProgressSeconds = last.getProgressSeconds();
            lastWatchedAt = last.getUpdatedAt();
            lastLessonTitle = lessonRepository.findById(last.getLessonId())
                .map(LearningLesson::getTitle)
                .orElse(null);
        }
        return new CourseProgressResponse(
            course.getId(), total, (int) completed, percent,
            lastLessonId, lastLessonTitle, lastProgressSeconds, lastWatchedAt
        );
    }

    @Transactional(readOnly = true)
    public ResumePlaybackResponse getResumePlayback(UUID learnerId, UUID courseId) {
        courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        List<LearningLesson> orderedLessons = orderedLessons(courseId);
        if (orderedLessons.isEmpty()) {
            return new ResumePlaybackResponse(courseId, null, null, 0, false, false);
        }

        WatchProgress last = progressRepository
            .findFirstByLearnerIdAndCourseIdOrderByUpdatedAtDesc(learnerId, courseId)
            .orElse(null);
        if (last != null && !last.isCompleted() && last.getProgressSeconds() > 0) {
            LearningLesson lesson = lessonRepository.findById(last.getLessonId()).orElse(null);
            if (lesson != null && isLessonAccessible(learnerId, lesson)) {
                return new ResumePlaybackResponse(
                    courseId, lesson.getId(), lesson.getTitle(),
                    last.getProgressSeconds(), false, true
                );
            }
        }

        Map<UUID, WatchProgress> progressMap = progressRepository.findByLearnerIdAndCourseId(learnerId, courseId)
            .stream().collect(Collectors.toMap(WatchProgress::getLessonId, p -> p));
        for (LearningLesson lesson : orderedLessons) {
            if (!isLessonAccessible(learnerId, lesson)) {
                continue;
            }
            WatchProgress progress = progressMap.get(lesson.getId());
            if (progress == null || !progress.isCompleted()) {
                int seconds = progress != null ? progress.getProgressSeconds() : 0;
                boolean completed = progress != null && progress.isCompleted();
                return new ResumePlaybackResponse(
                    courseId, lesson.getId(), lesson.getTitle(), seconds, completed, progress != null
                );
            }
        }

        LearningLesson first = orderedLessons.stream()
            .filter(l -> isLessonAccessible(learnerId, l))
            .findFirst()
            .orElse(orderedLessons.get(0));
        return new ResumePlaybackResponse(courseId, first.getId(), first.getTitle(), 0, false, false);
    }

    @Transactional(readOnly = true)
    public List<StreamCourseCardResponse> continueLearning(UUID learnerId) {
        return progressRepository.findByLearnerIdOrderByUpdatedAtDesc(learnerId).stream()
            .map(WatchProgress::getCourseId).distinct().limit(10)
            .map(courseRepository::findById)
            .filter(opt -> opt.isPresent())
            .map(opt -> toCard(opt.get(), learnerId))
            .toList();
    }

    private LearningCourse ownedCourse(UUID mentorId, UUID courseId) {
        LearningCourse course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (!course.getMentorId().equals(mentorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your course");
        }
        return course;
    }

    private LearningCourse ownedAdminCourse(UUID adminId, UUID courseId) {
        LearningCourse course = ownedCourse(adminId, courseId);
        if (!"ADMIN".equals(course.getCreatorType())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not an admin course");
        }
        return course;
    }

    private void applyCourseFields(LearningCourse course, CreateStreamCourseRequest request) {
        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setCategory(request.category());
        course.setThumbnailUrl(request.thumbnailUrl());
        course.setBannerUrl(request.bannerUrl());
        course.setPricingType(request.pricingType().toUpperCase(Locale.ROOT));
        course.setPriceCents(request.priceCents());
        course.setDiscountPriceCents(request.discountPriceCents());
        course.setDifficulty(request.difficulty().toUpperCase(Locale.ROOT));
        if (request.currency() != null && !request.currency().isBlank()) {
            course.setCurrency(request.currency().toUpperCase(Locale.ROOT));
        }
        course.setTags(request.tags() == null ? null : String.join(",", request.tags()));
        course.setWhatYouLearn(request.whatYouLearn());
        course.setRequirements(request.requirements());
    }

    private void saveSections(UUID courseId, List<CreateStreamSectionRequest> sections) {
        if (sections == null) return;
        for (CreateStreamSectionRequest sectionReq : sections) {
            LearningCourseSection section = new LearningCourseSection();
            section.setCourseId(courseId);
            section.setTitle(sectionReq.title());
            section.setSortOrder(sectionReq.sortOrder());
            LearningCourseSection savedSection = sectionRepository.save(section);
            if (sectionReq.lessons() != null) {
                for (CreateStreamLessonRequest lessonReq : sectionReq.lessons()) {
                    LearningLesson lesson = new LearningLesson();
                    lesson.setCourseId(courseId);
                    lesson.setSectionId(savedSection.getId());
                    lesson.setTitle(lessonReq.title());
                    lesson.setVideoUrl(lessonReq.videoUrl());
                    lesson.setDurationSeconds(lessonReq.durationSeconds());
                    lesson.setSortOrder(lessonReq.sortOrder());
                    lesson.setPreviewFree(lessonReq.previewFree());
                    lessonRepository.save(lesson);
                }
            }
        }
    }

    private void recalcDuration(UUID courseId) {
        int total = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId).stream()
            .mapToInt(LearningLesson::getDurationSeconds).sum();
        courseRepository.findById(courseId).ifPresent(c -> {
            c.setTotalDurationSeconds(total);
            courseRepository.save(c);
        });
    }

    private boolean hasAccess(UUID learnerId, LearningCourse course) {
        if (course.getMentorId().equals(learnerId)) {
            return true;
        }
        if ("FREE".equals(course.getPricingType())) {
            return true;
        }
        return purchaseRepository.existsByCourseIdAndLearnerIdAndStatus(course.getId(), learnerId, COMPLETED);
    }

    private StreamLessonResponse toLesson(
        LearningLesson lesson, LearningCourse course, boolean purchased, WatchProgress progress
    ) {
        boolean locked = "PAID".equals(course.getPricingType()) && !purchased && !lesson.isPreviewFree();
        String playbackUrl = locked ? null : resolveLessonVideoUrl(lesson);
        return new StreamLessonResponse(
            lesson.getId(), lesson.getSectionId(), lesson.getTitle(), lesson.getDescription(),
            playbackUrl, lesson.getThumbnailUrl(),
            lesson.getDurationSeconds(), lesson.getSortOrder(), lesson.isPreviewFree(),
            locked,
            progress != null ? progress.getProgressSeconds() : 0,
            progress != null && progress.isCompleted()
        );
    }

    private String resolveLessonVideoUrl(LearningLesson lesson) {
        if (lesson.getVideoUrl() == null || lesson.getVideoUrl().isBlank()) {
            return null;
        }
        if (mediaStorageService.isLocalMedia(lesson.getVideoUrl())) {
            return "/api/videos/stream/" + lesson.getId();
        }
        return lesson.getVideoUrl();
    }

    private StreamCourseCardResponse toCard(LearningCourse course, UUID learnerId) {
        boolean purchased = hasAccess(learnerId, course);
        boolean saved = savedRepository.existsByIdLearnerIdAndIdCourseId(learnerId, course.getId());
        int watchPct = calcWatchPercent(learnerId, course.getId());
        int totalLessons = (int) lessonRepository.countByCourseId(course.getId());
        return new StreamCourseCardResponse(
            course.getId(),
            course.getMentorId(),
            course.getMentorDisplayName(),
            course.getCreatorType(),
            course.getCategory(),
            course.getTitle(),
            course.getDescription(),
            course.getThumbnailUrl(),
            course.getPricingType(),
            course.getCurrency(),
            course.getPriceCents(),
            course.getDiscountPriceCents(),
            course.getDifficulty(),
            parseTags(course.getTags()),
            course.getAverageRating(),
            course.getRatingCount(),
            course.getEnrolledCount(),
            course.getLikeCount(),
            totalLessons,
            course.getTotalDurationSeconds(),
            course.getPublishedAt(),
            course.getStatus(),
            purchased,
            saved,
            false,
            watchPct
        );
    }

    private int calcWatchPercent(UUID learnerId, UUID courseId) {
        List<LearningLesson> lessons = lessonRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        if (lessons.isEmpty()) return 0;
        List<WatchProgress> progress = progressRepository.findByLearnerIdAndCourseId(learnerId, courseId);
        if (progress.isEmpty()) return 0;
        long completed = progress.stream().filter(WatchProgress::isCompleted).count();
        return (int) ((completed * 100) / lessons.size());
    }

    private boolean isLessonComplete(LearningLesson lesson, int progressSeconds) {
        if (lesson.getDurationSeconds() <= 0) {
            return progressSeconds >= 30;
        }
        return progressSeconds >= Math.floor(lesson.getDurationSeconds() * 0.9);
    }

    private List<LearningLesson> orderedLessons(UUID courseId) {
        List<LearningLesson> lessons = new ArrayList<>();
        for (LearningCourseSection section : sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId)) {
            lessons.addAll(lessonRepository.findBySectionIdOrderBySortOrderAsc(section.getId()));
        }
        return lessons;
    }

    private boolean isLessonAccessible(UUID learnerId, LearningLesson lesson) {
        LearningCourse course = courseRepository.findById(lesson.getCourseId()).orElse(null);
        if (course == null) return false;
        if ("PAID".equals(course.getPricingType()) && !hasAccess(learnerId, course) && !lesson.isPreviewFree()) {
            return false;
        }
        return lesson.getVideoUrl() != null && !lesson.getVideoUrl().isBlank();
    }

    private StreamPageResponse<StreamCourseCardResponse> toPage(Page<LearningCourse> page, UUID learnerId) {
        List<StreamCourseCardResponse> items = page.getContent().stream().map(c -> toCard(c, learnerId)).toList();
        return new StreamPageResponse<>(items, page.getNumber(), page.getSize(), page.getTotalElements(), page.hasNext());
    }

    private PageRequest pageRequest(int page, int size, String sort) {
        Sort s = Sort.by(Sort.Direction.DESC, "publishedAt");
        if ("rating".equalsIgnoreCase(sort)) s = Sort.by(Sort.Direction.DESC, "averageRating");
        if ("price_low".equalsIgnoreCase(sort)) s = Sort.by(Sort.Direction.ASC, "priceCents");
        if ("price_high".equalsIgnoreCase(sort)) s = Sort.by(Sort.Direction.DESC, "priceCents");
        if ("views".equalsIgnoreCase(sort)) s = Sort.by(Sort.Direction.DESC, "enrolledCount");
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), s);
    }

    private double scoreCourse(LearningCourse c, List<UUID> followed, Set<String> tags) {
        double score = c.getAverageRating() * 10 + c.getEnrolledCount() * 0.1;
        if (followed.contains(c.getMentorId())) score += 50;
        for (String tag : parseTags(c.getTags())) {
            if (tags.contains(tag)) score += 15;
        }
        return score;
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(t -> !t.isEmpty()).toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
