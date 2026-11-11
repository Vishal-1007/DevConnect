package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.CreateTutorialRequest;
import com.developersconnect.mentor.dto.ReorderRequest;
import com.developersconnect.mentor.dto.TopicContentRequest;
import com.developersconnect.mentor.dto.TutorialBuilderResponse;
import com.developersconnect.mentor.dto.TutorialSectionRequest;
import com.developersconnect.mentor.dto.TutorialTopicRequest;
import com.developersconnect.mentor.dto.UpdateTutorialRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.TutorialPlatformService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/admin/tutorials")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTutorialController {

    private final TutorialPlatformService tutorialService;

    public AdminTutorialController(TutorialPlatformService tutorialService) {
        this.tutorialService = tutorialService;
    }

    @GetMapping
    public List<TutorialBuilderResponse> list() {
        return tutorialService.listForEditor("ADMIN", null);
    }

    @GetMapping("/{tutorialId}")
    public TutorialBuilderResponse get(@PathVariable UUID tutorialId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.getBuilder(tutorialId, adminId, true);
    }

    @PostMapping
    public ResponseEntity<TutorialBuilderResponse> create(@Valid @RequestBody CreateTutorialRequest request, Authentication auth) {
        AuthPrincipal principal = (AuthPrincipal) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            tutorialService.createTutorial(request, principal.accountId(), "ADMIN", principal.username())
        );
    }

    @PutMapping("/{tutorialId}")
    public TutorialBuilderResponse update(@PathVariable UUID tutorialId, @Valid @RequestBody UpdateTutorialRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.updateTutorial(tutorialId, request, adminId, true);
    }

    @PostMapping("/{tutorialId}/publish")
    public TutorialBuilderResponse publish(@PathVariable UUID tutorialId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.publishTutorial(tutorialId, adminId, true);
    }

    @PostMapping("/{tutorialId}/unpublish")
    public TutorialBuilderResponse unpublish(@PathVariable UUID tutorialId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.unpublishTutorial(tutorialId, adminId, true);
    }

    @DeleteMapping("/{tutorialId}")
    public ResponseEntity<Void> delete(@PathVariable UUID tutorialId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        tutorialService.deleteTutorial(tutorialId, adminId, true);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tutorialId}/sections")
    public TutorialBuilderResponse createSection(@PathVariable UUID tutorialId, @Valid @RequestBody TutorialSectionRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.createSection(tutorialId, request, adminId, true);
    }

    @PutMapping("/{tutorialId}/sections/{sectionId}")
    public TutorialBuilderResponse updateSection(@PathVariable UUID tutorialId, @PathVariable UUID sectionId, @Valid @RequestBody TutorialSectionRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.updateSection(tutorialId, sectionId, request, adminId, true);
    }

    @DeleteMapping("/{tutorialId}/sections/{sectionId}")
    public TutorialBuilderResponse deleteSection(@PathVariable UUID tutorialId, @PathVariable UUID sectionId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.deleteSection(tutorialId, sectionId, adminId, true);
    }

    @PutMapping("/{tutorialId}/sections/reorder")
    public TutorialBuilderResponse reorderSections(@PathVariable UUID tutorialId, @RequestBody ReorderRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.reorderSections(tutorialId, request, adminId, true);
    }

    @PostMapping("/{tutorialId}/sections/{sectionId}/topics")
    public TutorialBuilderResponse createTopic(@PathVariable UUID tutorialId, @PathVariable UUID sectionId, @Valid @RequestBody TutorialTopicRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.createTopic(tutorialId, sectionId, request, adminId, true);
    }

    @PutMapping("/{tutorialId}/topics/{topicId}")
    public TutorialBuilderResponse updateTopic(@PathVariable UUID tutorialId, @PathVariable UUID topicId, @Valid @RequestBody TutorialTopicRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.updateTopic(tutorialId, topicId, request, adminId, true);
    }

    @DeleteMapping("/{tutorialId}/topics/{topicId}")
    public TutorialBuilderResponse deleteTopic(@PathVariable UUID tutorialId, @PathVariable UUID topicId, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.deleteTopic(tutorialId, topicId, adminId, true);
    }

    @PutMapping("/{tutorialId}/sections/{sectionId}/topics/reorder")
    public TutorialBuilderResponse reorderTopics(@PathVariable UUID tutorialId, @PathVariable UUID sectionId, @RequestBody ReorderRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.reorderTopics(tutorialId, sectionId, request, adminId, true);
    }

    @PutMapping("/{tutorialId}/topics/{topicId}/content")
    public TutorialBuilderResponse saveContent(@PathVariable UUID tutorialId, @PathVariable UUID topicId, @RequestBody TopicContentRequest request, Authentication auth) {
        UUID adminId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return tutorialService.saveTopicContent(tutorialId, topicId, request, adminId, true);
    }
}
