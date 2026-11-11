package com.developersconnect.user.service;

import com.developersconnect.user.dto.AdminCommunityRoomResponse;
import com.developersconnect.user.dto.CommunityRoomAnalyticsResponse;
import com.developersconnect.user.dto.CommunityRoomCategoryResponse;
import com.developersconnect.user.dto.UpdateAdminCommunityRoomRequest;
import com.developersconnect.user.dto.UpsertCommunityCategoryRequest;
import com.developersconnect.user.model.CommunityRoomCategory;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.model.VideoRoom;
import com.developersconnect.user.repository.CommunityRoomCategoryRepository;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.VideoRoomParticipantRepository;
import com.developersconnect.user.repository.VideoRoomRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminCommunityRoomService {

    private static final Set<String> VISIBILITIES = Set.of("public", "unlisted", "private");

    private final VideoRoomRepository roomRepository;
    private final VideoRoomParticipantRepository participantRepository;
    private final CommunityRoomCategoryRepository categoryRepository;
    private final UserProfileRepository userProfileRepository;

    public AdminCommunityRoomService(
        VideoRoomRepository roomRepository,
        VideoRoomParticipantRepository participantRepository,
        CommunityRoomCategoryRepository categoryRepository,
        UserProfileRepository userProfileRepository
    ) {
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.categoryRepository = categoryRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminCommunityRoomResponse> listRooms(String status, String category, String visibility, String q, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        PageRequest page = PageRequest.of(0, safeLimit);
        List<VideoRoom> rooms = resolveRoomList(status, page);
        String catFilter = normalizeCategoryFilter(category);
        String visFilter = normalizeVisibilityFilter(visibility);
        String query = q != null && !q.isBlank() ? q.trim().toLowerCase(Locale.ROOT) : null;

        return rooms.stream()
            .filter(r -> "community".equals(r.getUseCase()))
            .filter(r -> catFilter == null || catFilter.equals(r.getCategory()))
            .filter(r -> visFilter == null || visFilter.equals(r.getVisibility()))
            .filter(r -> query == null
                || r.getTitle().toLowerCase(Locale.ROOT).contains(query)
                || r.getDescription().toLowerCase(Locale.ROOT).contains(query))
            .map(this::toAdminResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminCommunityRoomResponse> listFeatured(String status, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        String normalizedStatus = normalizeStatus(status, "live");
        return roomRepository
            .findAllByFeaturedTrueAndParentRoomIdIsNullAndStatusOrderByFeaturedOrderAscCreatedAtDesc(
                normalizedStatus, PageRequest.of(0, safeLimit)
            )
            .stream()
            .filter(r -> "community".equals(r.getUseCase()))
            .map(this::toAdminResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminCommunityRoomResponse getRoom(UUID roomId) {
        return toAdminResponse(findCommunityRoom(roomId));
    }

    @Transactional(readOnly = true)
    public CommunityRoomAnalyticsResponse getAnalytics() {
        List<VideoRoom> rooms = roomRepository.findAllByParentRoomIdIsNullOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
            PageRequest.of(0, 500)
        ).stream().filter(r -> "community".equals(r.getUseCase())).toList();

        Map<String, Long> byCategory = new LinkedHashMap<>();
        long featured = 0;
        long publicCount = 0;
        long unlisted = 0;
        long priv = 0;
        long withMod = 0;
        long live = 0;

        for (VideoRoom room : rooms) {
            byCategory.merge(room.getCategory(), 1L, Long::sum);
            if (room.isFeatured()) {
                featured++;
            }
            String vis = room.getVisibility() != null ? room.getVisibility() : "public";
            switch (vis) {
                case "unlisted" -> unlisted++;
                case "private" -> priv++;
                default -> publicCount++;
            }
            if (room.getModeratorId() != null) {
                withMod++;
            }
            if ("live".equals(room.getStatus())) {
                live++;
            }
        }

        return new CommunityRoomAnalyticsResponse(
            rooms.size(),
            live,
            featured,
            publicCount,
            unlisted,
            priv,
            withMod,
            byCategory
        );
    }

    @Transactional
    public AdminCommunityRoomResponse updateRoom(UUID roomId, UpdateAdminCommunityRoomRequest request) {
        VideoRoom room = findCommunityRoom(roomId);

        if (request.featured() != null) {
            room.setFeatured(request.featured());
            if (!request.featured()) {
                room.setFeaturedOrder(0);
            }
        }
        if (request.featuredOrder() != null) {
            room.setFeaturedOrder(Math.max(0, request.featuredOrder()));
        }
        if (request.visibility() != null) {
            room.setVisibility(normalizeVisibility(request.visibility()));
        }
        if (request.category() != null) {
            String category = normalizeCategorySlug(request.category());
            ensureCategoryExists(category);
            room.setCategory(category);
        }
        if (request.moderatorId() != null) {
            if (!userProfileRepository.existsById(request.moderatorId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Moderator profile not found");
            }
            room.setModeratorId(request.moderatorId());
        }

        return toAdminResponse(roomRepository.save(room));
    }

    @Transactional
    public AdminCommunityRoomResponse clearModerator(UUID roomId) {
        VideoRoom room = findCommunityRoom(roomId);
        room.setModeratorId(null);
        return toAdminResponse(roomRepository.save(room));
    }

    @Transactional(readOnly = true)
    public List<CommunityRoomCategoryResponse> listCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscLabelAsc().stream()
            .map(this::toCategoryResponse)
            .toList();
    }

    @Transactional
    public CommunityRoomCategoryResponse createCategory(UpsertCommunityCategoryRequest request) {
        String slug = normalizeCategorySlug(request.slug());
        if (categoryRepository.existsBySlugIgnoreCase(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category slug already exists");
        }
        CommunityRoomCategory category = new CommunityRoomCategory();
        category.setSlug(slug);
        category.setLabel(request.label().trim());
        category.setDescription(request.description() != null ? request.description().trim() : null);
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        category.setActive(request.active() == null || request.active());
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public CommunityRoomCategoryResponse updateCategory(UUID id, UpsertCommunityCategoryRequest request) {
        CommunityRoomCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        String slug = normalizeCategorySlug(request.slug());
        if (categoryRepository.existsBySlugIgnoreCaseAndIdNot(slug, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category slug already exists");
        }
        category.setSlug(slug);
        category.setLabel(request.label().trim());
        category.setDescription(request.description() != null ? request.description().trim() : null);
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.active() != null) {
            category.setActive(request.active());
        }
        return toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID id) {
        CommunityRoomCategory category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        long inUse = roomRepository.findAll().stream()
            .filter(r -> category.getSlug().equals(r.getCategory()))
            .count();
        if (inUse > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot delete category: " + inUse + " room(s) still use it"
            );
        }
        categoryRepository.delete(category);
    }

    private List<VideoRoom> resolveRoomList(String status, PageRequest page) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return roomRepository.findAllByParentRoomIdIsNullOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(page);
        }
        return roomRepository.findAllByParentRoomIdIsNullAndStatusOrderByFeaturedDescFeaturedOrderAscCreatedAtDesc(
            normalizeStatus(status, "live"), page
        );
    }

    private VideoRoom findCommunityRoom(UUID roomId) {
        VideoRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (!"community".equals(room.getUseCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a community room");
        }
        return room;
    }

    private AdminCommunityRoomResponse toAdminResponse(VideoRoom room) {
        UserProfile host = userProfileRepository.findById(room.getHostId()).orElse(null);
        UserProfile moderator = room.getModeratorId() != null
            ? userProfileRepository.findById(room.getModeratorId()).orElse(null)
            : null;
        String categoryLabel = categoryRepository.findBySlugIgnoreCase(room.getCategory())
            .map(CommunityRoomCategory::getLabel)
            .orElse(formatCategoryLabel(room.getCategory()));

        return new AdminCommunityRoomResponse(
            room.getId(),
            room.getTitle(),
            room.getDescription(),
            room.getCategory(),
            categoryLabel,
            room.getStatus(),
            room.getVisibility(),
            visibilityLabel(room.getVisibility()),
            room.isFeatured(),
            room.getFeaturedOrder(),
            room.getHostId(),
            displayName(host),
            room.getModeratorId(),
            moderator != null ? displayName(moderator) : null,
            room.getMaxParticipants(),
            participantRepository.countByRoomIdAndLeftAtIsNull(room.getId()),
            Set.copyOf(room.getTags()),
            room.getCreatedAt()
        );
    }

    private CommunityRoomCategoryResponse toCategoryResponse(CommunityRoomCategory category) {
        long roomCount = roomRepository.findAll().stream()
            .filter(r -> category.getSlug().equals(r.getCategory()))
            .count();
        return new CommunityRoomCategoryResponse(
            category.getId(),
            category.getSlug(),
            category.getLabel(),
            category.getDescription(),
            category.getDisplayOrder(),
            category.isActive(),
            roomCount
        );
    }

    private void ensureCategoryExists(String slug) {
        if (categoryRepository.findBySlugIgnoreCase(slug).isEmpty()) {
            CommunityRoomCategory category = new CommunityRoomCategory();
            category.setSlug(slug);
            category.setLabel(formatCategoryLabel(slug));
            category.setDisplayOrder(99);
            category.setActive(true);
            categoryRepository.save(category);
        }
    }

    private String displayName(UserProfile profile) {
        if (profile == null) {
            return "Developer";
        }
        if (profile.getDisplayName() != null && !profile.getDisplayName().isBlank()) {
            return profile.getDisplayName();
        }
        return profile.getUsername();
    }

    private String formatCategoryLabel(String slug) {
        if (slug == null || slug.isBlank()) {
            return "General";
        }
        String[] parts = slug.replace('-', ' ').split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append(' ');
            }
            sb.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                sb.append(part.substring(1));
            }
        }
        return sb.isEmpty() ? "General" : sb.toString();
    }

    private String visibilityLabel(String visibility) {
        return switch (visibility != null ? visibility : "public") {
            case "unlisted" -> "Unlisted";
            case "private" -> "Private";
            default -> "Public";
        };
    }

    private String normalizeVisibility(String value) {
        String v = value.trim().toLowerCase(Locale.ROOT);
        if (!VISIBILITIES.contains(v)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility: " + value);
        }
        return v;
    }

    private String normalizeCategorySlug(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replace(' ', '-');
    }

    private String normalizeCategoryFilter(String category) {
        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            return null;
        }
        return normalizeCategorySlug(category);
    }

    private String normalizeVisibilityFilter(String visibility) {
        if (visibility == null || visibility.isBlank() || "all".equalsIgnoreCase(visibility)) {
            return null;
        }
        return normalizeVisibility(visibility);
    }

    private String normalizeStatus(String status, String fallback) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) {
            return fallback;
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }
}
