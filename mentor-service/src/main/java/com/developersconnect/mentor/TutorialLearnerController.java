package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.TutorialCardResponse;
import com.developersconnect.mentor.dto.TutorialPurchaseRequest;
import com.developersconnect.mentor.dto.TutorialReaderResponse;
import com.developersconnect.mentor.dto.TutorialSearchResultResponse;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.TutorialPlatformService;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/tutorials")
public class TutorialLearnerController {

    private final TutorialPlatformService tutorialService;

    public TutorialLearnerController(TutorialPlatformService tutorialService) {
        this.tutorialService = tutorialService;
    }

    private UUID userId(Authentication auth) {
        return ((AuthPrincipal) auth.getPrincipal()).accountId();
    }

    @GetMapping
    public List<TutorialCardResponse> browse(
        Authentication auth,
        @RequestParam(required = false) String creatorType,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String q
    ) {
        return tutorialService.browse(userId(auth), creatorType, category, q);
    }

    @GetMapping("/search")
    public List<TutorialSearchResultResponse> search(Authentication auth, @RequestParam String q) {
        return tutorialService.search(userId(auth), q);
    }

    @GetMapping("/{tutorialId}")
    public TutorialReaderResponse read(
        Authentication auth,
        @PathVariable UUID tutorialId,
        @RequestParam(required = false) UUID topicId
    ) {
        return tutorialService.readTutorial(tutorialId, topicId, userId(auth));
    }

    @PostMapping("/{tutorialId}/topics/{topicId}/complete")
    public TutorialReaderResponse completeTopic(Authentication auth, @PathVariable UUID tutorialId, @PathVariable UUID topicId) {
        return tutorialService.completeTopic(tutorialId, topicId, userId(auth));
    }

    @PostMapping("/{tutorialId}/save")
    public void saveTutorial(Authentication auth, @PathVariable UUID tutorialId) {
        tutorialService.saveTutorial(tutorialId, userId(auth));
    }

    @PostMapping("/{tutorialId}/unsave")
    public void unsaveTutorial(Authentication auth, @PathVariable UUID tutorialId) {
        tutorialService.unsaveTutorial(tutorialId, userId(auth));
    }

    @PostMapping("/{tutorialId}/topics/{topicId}/bookmark")
    public void bookmarkTopic(Authentication auth, @PathVariable UUID tutorialId, @PathVariable UUID topicId) {
        tutorialService.bookmarkTopic(tutorialId, topicId, userId(auth));
    }

    @PostMapping("/{tutorialId}/topics/{topicId}/unbookmark")
    public void unbookmarkTopic(Authentication auth, @PathVariable UUID topicId) {
        tutorialService.unbookmarkTopic(topicId, userId(auth));
    }

    @PostMapping("/{tutorialId}/cart")
    public void addToCart(Authentication auth, @PathVariable UUID tutorialId) {
        tutorialService.addToCart(tutorialId, userId(auth));
    }

    @PostMapping("/{tutorialId}/purchase")
    public void purchase(Authentication auth, @PathVariable UUID tutorialId, @RequestBody TutorialPurchaseRequest request) {
        tutorialService.purchaseTutorial(tutorialId, userId(auth), request);
    }
}
