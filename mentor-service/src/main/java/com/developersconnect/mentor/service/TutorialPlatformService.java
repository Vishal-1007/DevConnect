package com.developersconnect.mentor.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.mentor.dto.CreateTutorialRequest;
import com.developersconnect.mentor.dto.ReorderRequest;
import com.developersconnect.mentor.dto.TopicContentRequest;
import com.developersconnect.mentor.dto.TutorialBuilderResponse;
import com.developersconnect.mentor.dto.TutorialBuilderSectionResponse;
import com.developersconnect.mentor.dto.TutorialBuilderTopicResponse;
import com.developersconnect.mentor.dto.TutorialCardResponse;
import com.developersconnect.mentor.dto.TutorialPurchaseRequest;
import com.developersconnect.mentor.dto.TutorialReaderResponse;
import com.developersconnect.mentor.dto.TutorialSearchResultResponse;
import com.developersconnect.mentor.dto.TutorialSectionRequest;
import com.developersconnect.mentor.dto.TutorialSectionSummaryResponse;
import com.developersconnect.mentor.dto.TutorialTopicDetailResponse;
import com.developersconnect.mentor.dto.TutorialTopicRequest;
import com.developersconnect.mentor.dto.TutorialTopicSummaryResponse;
import com.developersconnect.mentor.dto.UpdateTutorialRequest;
import com.developersconnect.mentor.model.BookmarkedTutorialTopic;
import com.developersconnect.mentor.model.SavedTutorial;
import com.developersconnect.mentor.model.TopicContent;
import com.developersconnect.mentor.model.Tutorial;
import com.developersconnect.mentor.model.TutorialCartItem;
import com.developersconnect.mentor.model.TutorialPurchase;
import com.developersconnect.mentor.model.TutorialSection;
import com.developersconnect.mentor.model.TutorialTopic;
import com.developersconnect.mentor.model.TutorialTopicProgress;
import com.developersconnect.mentor.repository.BookmarkedTutorialTopicRepository;
import com.developersconnect.mentor.repository.SavedTutorialRepository;
import com.developersconnect.mentor.repository.TopicContentRepository;
import com.developersconnect.mentor.repository.TutorialCartItemRepository;
import com.developersconnect.mentor.repository.TutorialPurchaseRepository;
import com.developersconnect.mentor.repository.TutorialRepository;
import com.developersconnect.mentor.repository.TutorialSectionRepository;
import com.developersconnect.mentor.repository.TutorialTopicProgressRepository;
import com.developersconnect.mentor.repository.TutorialTopicRepository;

@Service
public class TutorialPlatformService {

    private static final String PUBLISHED = "PUBLISHED";
    private static final String DRAFT = "DRAFT";
    private static final String COMPLETED = "COMPLETED";
    private static final String FREE = "FREE";
    private static final String PAID = "PAID";

    private final TutorialRepository tutorialRepository;
    private final TutorialSectionRepository sectionRepository;
    private final TutorialTopicRepository topicRepository;
    private final TopicContentRepository contentRepository;
    private final TutorialPurchaseRepository purchaseRepository;
    private final TutorialCartItemRepository cartRepository;
    private final SavedTutorialRepository savedRepository;
    private final BookmarkedTutorialTopicRepository bookmarkRepository;
    private final TutorialTopicProgressRepository progressRepository;
    private final ContentNotificationService contentNotificationService;

    public TutorialPlatformService(
        TutorialRepository tutorialRepository,
        TutorialSectionRepository sectionRepository,
        TutorialTopicRepository topicRepository,
        TopicContentRepository contentRepository,
        TutorialPurchaseRepository purchaseRepository,
        TutorialCartItemRepository cartRepository,
        SavedTutorialRepository savedRepository,
        BookmarkedTutorialTopicRepository bookmarkRepository,
        TutorialTopicProgressRepository progressRepository,
        ContentNotificationService notificationService
    ) {
        this.tutorialRepository = tutorialRepository;
        this.sectionRepository = sectionRepository;
        this.topicRepository = topicRepository;
        this.contentRepository = contentRepository;
        this.purchaseRepository = purchaseRepository;
        this.cartRepository = cartRepository;
        this.savedRepository = savedRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.progressRepository = progressRepository;
        this.contentNotificationService = notificationService;
    }

    // ── Admin / Mentor listing ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TutorialBuilderResponse> listForEditor(String creatorType, UUID createdBy) {
        List<Tutorial> tutorials;
        if (createdBy != null) {
            tutorials = tutorialRepository.findByCreatedByOrderByUpdatedAtDesc(createdBy);
        } else {
            tutorials = tutorialRepository.findAll().stream()
                .filter(t -> creatorType == null || creatorType.equals(t.getCreatorType()))
                .sorted(Comparator.comparing(Tutorial::getUpdatedAt).reversed())
                .toList();
        }
        return tutorials.stream().map(this::toBuilder).toList();
    }

    @Transactional(readOnly = true)
    public TutorialBuilderResponse getBuilder(UUID tutorialId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse createTutorial(CreateTutorialRequest req, UUID actorId, String creatorType, String creatorName) {
        Tutorial tutorial = new Tutorial();
        applyTutorialFields(tutorial, req);
        tutorial.setCreatedBy(actorId);
        tutorial.setCreatorType(creatorType);
        tutorial.setCreatorName(creatorName);
        tutorial.setStatus(DRAFT);
        return toBuilder(tutorialRepository.save(tutorial));
    }

    @Transactional
    public TutorialBuilderResponse updateTutorial(UUID tutorialId, UpdateTutorialRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        applyTutorialFields(tutorial, req);
        return toBuilder(tutorialRepository.save(tutorial));
    }

    @Transactional
    public TutorialBuilderResponse publishTutorial(UUID tutorialId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        tutorial.setStatus(PUBLISHED);
        tutorial.setPublishedAt(Instant.now());
        tutorialRepository.save(tutorial);
        contentNotificationService.notifyLearningResourcePublished(tutorial.getTitle(), actorId);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse unpublishTutorial(UUID tutorialId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        tutorial.setStatus(DRAFT);
        return toBuilder(tutorialRepository.save(tutorial));
    }

    @Transactional
    public void deleteTutorial(UUID tutorialId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        contentRepository.findAll().stream()
            .filter(c -> topicRepository.findById(c.getTopicId()).map(t -> t.getTutorialId().equals(tutorialId)).orElse(false))
            .forEach(c -> contentRepository.delete(c));
        topicRepository.deleteByTutorialId(tutorialId);
        sectionRepository.deleteByTutorialId(tutorialId);
        tutorialRepository.delete(tutorial);
    }

    // ── Sections ─────────────────────────────────────────────────────────────

    @Transactional
    public TutorialBuilderResponse createSection(UUID tutorialId, TutorialSectionRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        int nextOrder = sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorialId).size();
        TutorialSection section = new TutorialSection();
        section.setTutorialId(tutorialId);
        section.setTitle(req.title().trim());
        section.setOrderIndex(nextOrder);
        sectionRepository.save(section);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse updateSection(UUID tutorialId, UUID sectionId, TutorialSectionRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        TutorialSection section = findSection(sectionId, tutorialId);
        section.setTitle(req.title().trim());
        sectionRepository.save(section);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse deleteSection(UUID tutorialId, UUID sectionId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        TutorialSection section = findSection(sectionId, tutorialId);
        topicRepository.findBySectionIdOrderByOrderIndexAsc(sectionId).forEach(topic -> {
            contentRepository.deleteByTopicId(topic.getId());
            topicRepository.delete(topic);
        });
        sectionRepository.delete(section);
        reindexSections(tutorialId);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse reorderSections(UUID tutorialId, ReorderRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        applyOrder(sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorialId), req.orderedIds(),
            (section, index) -> section.setOrderIndex(index));
        return toBuilder(tutorial);
    }

    // ── Topics ───────────────────────────────────────────────────────────────

    @Transactional
    public TutorialBuilderResponse createTopic(UUID tutorialId, UUID sectionId, TutorialTopicRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        findSection(sectionId, tutorialId);
        int nextOrder = topicRepository.findBySectionIdOrderByOrderIndexAsc(sectionId).size();
        TutorialTopic topic = new TutorialTopic();
        topic.setTutorialId(tutorialId);
        topic.setSectionId(sectionId);
        topic.setTitle(req.title().trim());
        topic.setOrderIndex(nextOrder);
        topicRepository.save(topic);
        TopicContent content = new TopicContent();
        content.setTopicId(topic.getId());
        content.setHtmlContent("<p>Start writing your topic content here…</p>");
        contentRepository.save(content);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse updateTopic(UUID tutorialId, UUID topicId, TutorialTopicRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        TutorialTopic topic = findTopic(topicId, tutorialId);
        topic.setTitle(req.title().trim());
        topicRepository.save(topic);
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse deleteTopic(UUID tutorialId, UUID topicId, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        TutorialTopic topic = findTopic(topicId, tutorialId);
        contentRepository.deleteByTopicId(topicId);
        topicRepository.delete(topic);
        reindexTopics(topic.getSectionId());
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse reorderTopics(UUID tutorialId, UUID sectionId, ReorderRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        findSection(sectionId, tutorialId);
        applyOrder(topicRepository.findBySectionIdOrderByOrderIndexAsc(sectionId), req.orderedIds(),
            (topic, index) -> topic.setOrderIndex(index));
        return toBuilder(tutorial);
    }

    @Transactional
    public TutorialBuilderResponse saveTopicContent(UUID tutorialId, UUID topicId, TopicContentRequest req, UUID actorId, boolean admin) {
        Tutorial tutorial = findTutorial(tutorialId);
        assertCanEdit(tutorial, actorId, admin);
        findTopic(topicId, tutorialId);
        TopicContent content = contentRepository.findByTopicId(topicId).orElseGet(() -> {
            TopicContent c = new TopicContent();
            c.setTopicId(topicId);
            return c;
        });
        content.setHtmlContent(req.htmlContent() == null ? "" : req.htmlContent());
        contentRepository.save(content);
        return toBuilder(tutorial);
    }

    // ── Learner ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TutorialCardResponse> browse(UUID userId, String creatorType, String category, String search) {
        return tutorialRepository.searchPublished(emptyToNull(creatorType), emptyToNull(category), emptyToNull(search))
            .stream()
            .map(t -> toCard(t, userId))
            .toList();
    }

    @Transactional(readOnly = true)
    public TutorialReaderResponse readTutorial(UUID tutorialId, UUID topicId, UUID userId) {
        Tutorial tutorial = findTutorial(tutorialId);
        if (!PUBLISHED.equals(tutorial.getStatus()) && !hasAccess(tutorial, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tutorial not found");
        }
        boolean locked = isLocked(tutorial, userId);
        List<TutorialSection> sections = sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorialId);
        List<TutorialTopic> allTopics = orderedTopics(tutorialId);
        UUID resolvedTopicId = resolveTopicId(topicId, userId, tutorialId, allTopics);
        TutorialTopicDetailResponse topicDetail = locked
            ? null
            : buildTopicDetail(resolvedTopicId, userId, tutorialId, sections, allTopics);
        if (!locked && resolvedTopicId != null) {
            recordView(userId, tutorialId, resolvedTopicId);
        }
        return buildReader(tutorial, userId, locked, sections, allTopics, resolvedTopicId, topicDetail);
    }

    @Transactional
    public TutorialReaderResponse completeTopic(UUID tutorialId, UUID topicId, UUID userId) {
        if (isLocked(findTutorial(tutorialId), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Purchase required");
        }
        TutorialTopicProgress progress = progressRepository.findByUserIdAndTopicId(userId, topicId)
            .orElseGet(() -> {
                TutorialTopicProgress p = new TutorialTopicProgress();
                p.setUserId(userId);
                p.setTutorialId(tutorialId);
                p.setTopicId(topicId);
                return p;
            });
        progress.setCompleted(true);
        progress.setCompletedAt(Instant.now());
        progress.setLastViewedAt(Instant.now());
        progressRepository.save(progress);
        return readTutorial(tutorialId, topicId, userId);
    }

    @Transactional
    public void saveTutorial(UUID tutorialId, UUID userId) {
        if (savedRepository.existsByUserIdAndTutorialId(userId, tutorialId)) return;
        SavedTutorial saved = new SavedTutorial();
        saved.setUserId(userId);
        saved.setTutorialId(tutorialId);
        savedRepository.save(saved);
    }

    @Transactional
    public void unsaveTutorial(UUID tutorialId, UUID userId) {
        savedRepository.deleteByUserIdAndTutorialId(userId, tutorialId);
    }

    @Transactional
    public void bookmarkTopic(UUID tutorialId, UUID topicId, UUID userId) {
        if (bookmarkRepository.existsByUserIdAndTopicId(userId, topicId)) return;
        BookmarkedTutorialTopic bookmark = new BookmarkedTutorialTopic();
        bookmark.setUserId(userId);
        bookmark.setTopicId(topicId);
        bookmark.setTutorialId(tutorialId);
        bookmarkRepository.save(bookmark);
    }

    @Transactional
    public void unbookmarkTopic(UUID topicId, UUID userId) {
        bookmarkRepository.deleteByUserIdAndTopicId(userId, topicId);
    }

    @Transactional
    public void addToCart(UUID tutorialId, UUID userId) {
        Tutorial tutorial = findTutorial(tutorialId);
        if (!PAID.equals(tutorial.getCourseType())) return;
        if (cartRepository.existsByUserIdAndTutorialId(userId, tutorialId)) return;
        TutorialCartItem item = new TutorialCartItem();
        item.setUserId(userId);
        item.setTutorialId(tutorialId);
        cartRepository.save(item);
    }

    @Transactional
    public void purchaseTutorial(UUID tutorialId, UUID userId, TutorialPurchaseRequest request) {
        Tutorial tutorial = findTutorial(tutorialId);
        if (!PAID.equals(tutorial.getCourseType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tutorial is free");
        }
        if (purchaseRepository.existsByUserIdAndTutorialIdAndPaymentStatus(userId, tutorialId, COMPLETED)) return;
        TutorialPurchase purchase = new TutorialPurchase();
        purchase.setUserId(userId);
        purchase.setTutorialId(tutorialId);
        purchase.setPaymentId(request.paymentId());
        purchase.setPaymentStatus(COMPLETED);
        purchase.setAmountCents(tutorial.getPriceCents());
        purchaseRepository.save(purchase);
        cartRepository.deleteByUserIdAndTutorialId(userId, tutorialId);
    }

    @Transactional(readOnly = true)
    public List<TutorialSearchResultResponse> search(UUID userId, String q) {
        if (q == null || q.isBlank()) return List.of();
        String needle = q.toLowerCase(Locale.ROOT);
        List<TutorialSearchResultResponse> results = new ArrayList<>();
        for (Tutorial tutorial : tutorialRepository.findByStatusOrderByUpdatedAtDesc(PUBLISHED)) {
            if (tutorial.getTitle().toLowerCase(Locale.ROOT).contains(needle)) {
                results.add(new TutorialSearchResultResponse(
                    tutorial.getId(), tutorial.getTitle(), null, null, null, null, tutorial.getTitle()
                ));
            }
            for (TutorialSection section : sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorial.getId())) {
                if (section.getTitle().toLowerCase(Locale.ROOT).contains(needle)) {
                    results.add(new TutorialSearchResultResponse(
                        tutorial.getId(), tutorial.getTitle(), section.getId(), section.getTitle(), null, null, section.getTitle()
                    ));
                }
                for (TutorialTopic topic : topicRepository.findBySectionIdOrderByOrderIndexAsc(section.getId())) {
                    if (topic.getTitle().toLowerCase(Locale.ROOT).contains(needle)) {
                        results.add(new TutorialSearchResultResponse(
                            tutorial.getId(), tutorial.getTitle(), section.getId(), section.getTitle(),
                            topic.getId(), topic.getTitle(), topic.getTitle()
                        ));
                        continue;
                    }
                    contentRepository.findByTopicId(topic.getId()).ifPresent(content -> {
                        String html = content.getHtmlContent() == null ? "" : content.getHtmlContent().toLowerCase(Locale.ROOT);
                        if (html.contains(needle)) {
                            results.add(new TutorialSearchResultResponse(
                                tutorial.getId(), tutorial.getTitle(), section.getId(), section.getTitle(),
                                topic.getId(), topic.getTitle(), snippet(content.getHtmlContent(), needle)
                            ));
                        }
                    });
                }
            }
        }
        return results.stream().limit(30).toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Tutorial findTutorial(UUID id) {
        return tutorialRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tutorial not found"));
    }

    private TutorialSection findSection(UUID sectionId, UUID tutorialId) {
        TutorialSection section = sectionRepository.findById(sectionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));
        if (!section.getTutorialId().equals(tutorialId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Section mismatch");
        }
        return section;
    }

    private TutorialTopic findTopic(UUID topicId, UUID tutorialId) {
        TutorialTopic topic = topicRepository.findById(topicId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found"));
        if (!topic.getTutorialId().equals(tutorialId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic mismatch");
        }
        return topic;
    }

    private void assertCanEdit(Tutorial tutorial, UUID actorId, boolean admin) {
        if (admin) return;
        if (!tutorial.getCreatedBy().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
    }

    private boolean hasAccess(Tutorial tutorial, UUID userId) {
        return tutorial.getCreatedBy().equals(userId) || !isLocked(tutorial, userId);
    }

    private boolean isLocked(Tutorial tutorial, UUID userId) {
        if (FREE.equals(tutorial.getCourseType())) return false;
        if (tutorial.getCreatedBy().equals(userId)) return false;
        return !purchaseRepository.existsByUserIdAndTutorialIdAndPaymentStatus(userId, tutorial.getId(), COMPLETED);
    }

    private void applyTutorialFields(Tutorial tutorial, CreateTutorialRequest req) {
        tutorial.setTitle(req.title().trim());
        tutorial.setDescription(req.description());
        tutorial.setCategory(req.category());
        tutorial.setDifficulty(req.difficulty());
        tutorial.setTags(normalizeTags(req.tags()));
        tutorial.setCourseType(req.courseType());
        tutorial.setPriceCents(PAID.equals(req.courseType()) ? Math.max(0, req.priceCents() == null ? 0 : req.priceCents()) : 0);
    }

    private void applyTutorialFields(Tutorial tutorial, UpdateTutorialRequest req) {
        tutorial.setTitle(req.title().trim());
        tutorial.setDescription(req.description());
        tutorial.setCategory(req.category());
        tutorial.setDifficulty(req.difficulty());
        tutorial.setTags(normalizeTags(req.tags()));
        tutorial.setCourseType(req.courseType());
        tutorial.setPriceCents(PAID.equals(req.courseType()) ? Math.max(0, req.priceCents() == null ? 0 : req.priceCents()) : 0);
    }

    private TutorialBuilderResponse toBuilder(Tutorial tutorial) {
        List<TutorialSection> sections = sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorial.getId());
        List<UUID> topicIds = sections.stream()
            .flatMap(section -> topicRepository.findBySectionIdOrderByOrderIndexAsc(section.getId()).stream())
            .map(TutorialTopic::getId)
            .toList();
        Map<UUID, String> topicHtmlById = loadTopicHtmlContent(topicIds);
        List<TutorialBuilderSectionResponse> sectionResponses = sections.stream().map(section -> {
            List<TutorialBuilderTopicResponse> topics = topicRepository.findBySectionIdOrderByOrderIndexAsc(section.getId()).stream()
                .map(topic -> new TutorialBuilderTopicResponse(
                    topic.getId(),
                    topic.getTitle(),
                    topic.getOrderIndex(),
                    topicHtmlById.getOrDefault(topic.getId(), "")
                ))
                .toList();
            return new TutorialBuilderSectionResponse(section.getId(), section.getTitle(), section.getOrderIndex(), topics);
        }).toList();
        return new TutorialBuilderResponse(
            tutorial.getId(), tutorial.getTitle(), tutorial.getDescription(), tutorial.getCategory(),
            tutorial.getDifficulty(), parseTags(tutorial.getTags()), tutorial.getCourseType(), tutorial.getPriceCents(),
            tutorial.getCreatorType(), tutorial.getStatus(), tutorial.getPublishedAt(), sectionResponses
        );
    }

    private Map<UUID, String> loadTopicHtmlContent(List<UUID> topicIds) {
        Map<UUID, String> htmlByTopicId = new HashMap<>();
        if (topicIds.isEmpty()) {
            return htmlByTopicId;
        }
        for (TopicContent content : contentRepository.findByTopicIdIn(topicIds)) {
            htmlByTopicId.put(
                content.getTopicId(),
                content.getHtmlContent() == null ? "" : content.getHtmlContent()
            );
        }
        return htmlByTopicId;
    }

    private TutorialCardResponse toCard(Tutorial tutorial, UUID userId) {
        boolean purchased = purchaseRepository.existsByUserIdAndTutorialIdAndPaymentStatus(userId, tutorial.getId(), COMPLETED);
        boolean locked = isLocked(tutorial, userId);
        return new TutorialCardResponse(
            tutorial.getId(), tutorial.getTitle(), tutorial.getDescription(), tutorial.getCategory(),
            tutorial.getDifficulty(), parseTags(tutorial.getTags()), tutorial.getCourseType(), tutorial.getPriceCents(),
            tutorial.getCreatorType(), tutorial.getCreatorName(), tutorial.getStatus(),
            (int) topicRepository.countByTutorialId(tutorial.getId()),
            savedRepository.existsByUserIdAndTutorialId(userId, tutorial.getId()),
            purchased, locked, tutorial.getPublishedAt()
        );
    }

    private TutorialReaderResponse buildReader(
        Tutorial tutorial, UUID userId, boolean locked,
        List<TutorialSection> sections, List<TutorialTopic> allTopics,
        UUID currentTopicId, TutorialTopicDetailResponse topicDetail
    ) {
        Set<UUID> completed = progressRepository.findByUserIdAndTutorialId(userId, tutorial.getId()).stream()
            .filter(TutorialTopicProgress::isCompleted)
            .map(TutorialTopicProgress::getTopicId)
            .collect(Collectors.toSet());
        Set<UUID> bookmarked = bookmarkRepository.findByUserId(userId).stream()
            .map(BookmarkedTutorialTopic::getTopicId)
            .collect(Collectors.toSet());
        List<TutorialSectionSummaryResponse> sectionSummaries = sections.stream().map(section ->
            new TutorialSectionSummaryResponse(
                section.getId(), section.getTitle(), section.getOrderIndex(),
                topicRepository.findBySectionIdOrderByOrderIndexAsc(section.getId()).stream()
                    .map(topic -> new TutorialTopicSummaryResponse(
                        topic.getId(), topic.getTitle(), topic.getOrderIndex(),
                        completed.contains(topic.getId()), bookmarked.contains(topic.getId())
                    ))
                    .toList()
            )
        ).toList();
        int total = allTopics.size();
        int done = (int) progressRepository.countByUserIdAndTutorialIdAndCompletedTrue(userId, tutorial.getId());
        int percent = total == 0 ? 0 : (int) Math.round((done * 100.0) / total);
        UUID lastViewed = progressRepository.findFirstByUserIdAndTutorialIdOrderByLastViewedAtDesc(userId, tutorial.getId())
            .map(TutorialTopicProgress::getTopicId).orElse(null);
        return new TutorialReaderResponse(
            tutorial.getId(), tutorial.getTitle(), tutorial.getDescription(), tutorial.getCategory(),
            tutorial.getDifficulty(), parseTags(tutorial.getTags()), tutorial.getCourseType(), tutorial.getPriceCents(),
            tutorial.getCreatorType(), tutorial.getCreatorName(), locked,
            purchaseRepository.existsByUserIdAndTutorialIdAndPaymentStatus(userId, tutorial.getId(), COMPLETED),
            savedRepository.existsByUserIdAndTutorialId(userId, tutorial.getId()),
            total, done, percent, currentTopicId, lastViewed, sectionSummaries, topicDetail
        );
    }

    private TutorialTopicDetailResponse buildTopicDetail(
        UUID topicId, UUID userId, UUID tutorialId,
        List<TutorialSection> sections, List<TutorialTopic> orderedTopics
    ) {
        TutorialTopic topic = findTopic(topicId, tutorialId);
        TutorialSection section = sections.stream().filter(s -> s.getId().equals(topic.getSectionId())).findFirst().orElse(null);
        String html = contentRepository.findByTopicId(topicId).map(TopicContent::getHtmlContent).orElse("");
        int idx = indexOfTopic(orderedTopics, topicId);
        UUID prev = idx > 0 ? orderedTopics.get(idx - 1).getId() : null;
        UUID next = idx >= 0 && idx < orderedTopics.size() - 1 ? orderedTopics.get(idx + 1).getId() : null;
        boolean completed = progressRepository.findByUserIdAndTopicId(userId, topicId).map(TutorialTopicProgress::isCompleted).orElse(false);
        boolean bookmarked = bookmarkRepository.existsByUserIdAndTopicId(userId, topicId);
        return new TutorialTopicDetailResponse(
            topic.getId(), topic.getTitle(), topic.getSectionId(),
            section == null ? "" : section.getTitle(), html, prev, next, completed, bookmarked
        );
    }

    private void recordView(UUID userId, UUID tutorialId, UUID topicId) {
        TutorialTopicProgress progress = progressRepository.findByUserIdAndTopicId(userId, topicId)
            .orElseGet(() -> {
                TutorialTopicProgress p = new TutorialTopicProgress();
                p.setUserId(userId);
                p.setTutorialId(tutorialId);
                p.setTopicId(topicId);
                return p;
            });
        progress.setLastViewedAt(Instant.now());
        progressRepository.save(progress);
    }

    private UUID resolveTopicId(UUID topicId, UUID userId, UUID tutorialId, List<TutorialTopic> allTopics) {
        if (topicId != null) return topicId;
        return progressRepository.findFirstByUserIdAndTutorialIdOrderByLastViewedAtDesc(userId, tutorialId)
            .map(TutorialTopicProgress::getTopicId)
            .orElse(allTopics.isEmpty() ? null : allTopics.get(0).getId());
    }

    private List<TutorialTopic> orderedTopics(UUID tutorialId) {
        List<TutorialTopic> topics = new ArrayList<>();
        for (TutorialSection section : sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorialId)) {
            topics.addAll(topicRepository.findBySectionIdOrderByOrderIndexAsc(section.getId()));
        }
        return topics;
    }

    private int indexOfTopic(List<TutorialTopic> topics, UUID topicId) {
        for (int i = 0; i < topics.size(); i++) {
            if (topics.get(i).getId().equals(topicId)) return i;
        }
        return -1;
    }

    private void reindexSections(UUID tutorialId) {
        List<TutorialSection> sections = sectionRepository.findByTutorialIdOrderByOrderIndexAsc(tutorialId);
        for (int i = 0; i < sections.size(); i++) {
            sections.get(i).setOrderIndex(i);
        }
        sectionRepository.saveAll(sections);
    }

    private void reindexTopics(UUID sectionId) {
        List<TutorialTopic> topics = topicRepository.findBySectionIdOrderByOrderIndexAsc(sectionId);
        for (int i = 0; i < topics.size(); i++) {
            topics.get(i).setOrderIndex(i);
        }
        topicRepository.saveAll(topics);
    }

    private <T> void applyOrder(List<T> items, List<UUID> orderedIds, OrderSetter<T> setter) {
        Map<UUID, T> byId = new HashMap<>();
        for (T item : items) {
            UUID id = item instanceof TutorialSection s ? s.getId() : ((TutorialTopic) item).getId();
            byId.put(id, item);
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            T item = byId.get(orderedIds.get(i));
            if (item != null) setter.apply(item, i);
        }
        if (items.get(0) instanceof TutorialSection) {
            sectionRepository.saveAll(items.stream().map(TutorialSection.class::cast).toList());
        } else {
            topicRepository.saveAll(items.stream().map(TutorialTopic.class::cast).toList());
        }
    }

    @FunctionalInterface
    private interface OrderSetter<T> {
        void apply(T item, int index);
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) return null;
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.joining(","));
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String snippet(String html, String needle) {
        String plain = html.replaceAll("<[^>]+>", " ");
        int idx = plain.toLowerCase(Locale.ROOT).indexOf(needle);
        if (idx < 0) return plain.substring(0, Math.min(plain.length(), 120));
        int start = Math.max(0, idx - 40);
        return plain.substring(start, Math.min(plain.length(), start + 120)).trim();
    }
}
