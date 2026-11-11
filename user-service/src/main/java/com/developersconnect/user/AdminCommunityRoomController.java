package com.developersconnect.user;

import com.developersconnect.user.dto.AdminCommunityRoomResponse;
import com.developersconnect.user.dto.CommunityRoomAnalyticsResponse;
import com.developersconnect.user.dto.CommunityRoomCategoryResponse;
import com.developersconnect.user.dto.UpdateAdminCommunityRoomRequest;
import com.developersconnect.user.dto.UpsertCommunityCategoryRequest;
import com.developersconnect.user.service.AdminCommunityRoomService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/community-rooms")
public class AdminCommunityRoomController {

    private final AdminCommunityRoomService adminCommunityRoomService;

    public AdminCommunityRoomController(AdminCommunityRoomService adminCommunityRoomService) {
        this.adminCommunityRoomService = adminCommunityRoomService;
    }

    @GetMapping
    public ResponseEntity<List<AdminCommunityRoomResponse>> listRooms(
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String visibility,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "100") int limit
    ) {
        return ResponseEntity.ok(
            adminCommunityRoomService.listRooms(status, category, visibility, q, limit)
        );
    }

    @GetMapping("/featured")
    public ResponseEntity<List<AdminCommunityRoomResponse>> listFeatured(
        @RequestParam(defaultValue = "live") String status,
        @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(adminCommunityRoomService.listFeatured(status, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<CommunityRoomAnalyticsResponse> analytics() {
        return ResponseEntity.ok(adminCommunityRoomService.getAnalytics());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CommunityRoomCategoryResponse>> listCategories() {
        return ResponseEntity.ok(adminCommunityRoomService.listCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CommunityRoomCategoryResponse> createCategory(
        @Valid @RequestBody UpsertCommunityCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminCommunityRoomService.createCategory(request));
    }

    @PutMapping("/categories/{categoryId}")
    public ResponseEntity<CommunityRoomCategoryResponse> updateCategory(
        @PathVariable UUID categoryId,
        @Valid @RequestBody UpsertCommunityCategoryRequest request
    ) {
        return ResponseEntity.ok(adminCommunityRoomService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID categoryId) {
        adminCommunityRoomService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<AdminCommunityRoomResponse> getRoom(@PathVariable UUID roomId) {
        return ResponseEntity.ok(adminCommunityRoomService.getRoom(roomId));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<AdminCommunityRoomResponse> updateRoom(
        @PathVariable UUID roomId,
        @Valid @RequestBody UpdateAdminCommunityRoomRequest request
    ) {
        return ResponseEntity.ok(adminCommunityRoomService.updateRoom(roomId, request));
    }

    @DeleteMapping("/{roomId}/moderator")
    public ResponseEntity<AdminCommunityRoomResponse> clearModerator(@PathVariable UUID roomId) {
        return ResponseEntity.ok(adminCommunityRoomService.clearModerator(roomId));
    }
}
