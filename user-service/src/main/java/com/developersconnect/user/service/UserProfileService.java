package com.developersconnect.user.service;

import com.developersconnect.user.dto.CreateUserRatingRequest;
import com.developersconnect.user.dto.UserProfileResponse;
import com.developersconnect.user.dto.UserProfileUpdateRequest;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.model.UserRating;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.UserRatingRepository;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRatingRepository userRatingRepository;

    public UserProfileService(
        UserProfileRepository userProfileRepository,
        UserRatingRepository userRatingRepository
    ) {
        this.userProfileRepository = userProfileRepository;
        this.userRatingRepository = userRatingRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID id) {
        UserProfile profile = userProfileRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return toResponse(profile);
    }

    // NOT @Transactional — must stay outside a transaction boundary so we can
    // catch DataIntegrityViolationException thrown by concurrent inserts.
    //
    // Two kinds of violations can occur on first login:
    //   1. PK violation   → same UUID inserted by a racing thread → findById succeeds
    //   2. UK (username)  → same username with a DIFFERENT UUID already committed
    //                       (e.g. user re-registered) → fall back to findByUsername
    public UserProfileResponse getOrCreateProfile(UUID id, String username) {
        // Fast path: profile already exists for this UUID
        Optional<UserProfile> byId = userProfileRepository.findById(id);
        if (byId.isPresent()) {
            return toResponse(byId.get());
        }
        try {
            UserProfile created = new UserProfile();
            created.setId(id);
            created.setUsername(username);
            userProfileRepository.save(created);
        } catch (DataIntegrityViolationException ignored) {
            // Concurrent insert already committed — fall through to the lookup below.
        }
        // Try by primary key first (PK race), then by username (UK race)
        return toResponse(
            userProfileRepository.findById(id)
                .or(() -> userProfileRepository.findByUsername(username))
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Could not create or find profile"))
        );
    }

    @Transactional
    public UserProfileResponse upsertProfile(UUID id, String username, UserProfileUpdateRequest request) {
        // Look up by ID first, then by username (handles re-registered accounts)
        UserProfile profile = userProfileRepository.findById(id)
            .or(() -> userProfileRepository.findByUsername(username))
            .orElseGet(() -> {
                UserProfile created = new UserProfile();
                created.setId(id);
                created.setUsername(username);
                return created;
            });

        if (request.displayName() != null) {
            profile.setDisplayName(request.displayName());
        }
        if (request.bio() != null) {
            profile.setBio(request.bio());
        }
        if (request.avatarUrl() != null) {
            profile.setAvatarUrl(request.avatarUrl());
        }
        if (request.location() != null) {
            profile.setLocation(request.location());
        }
        if (request.role() != null) {
            profile.setRole(request.role());
        }
        if (request.experienceLevel() != null) {
            profile.setExperienceLevel(request.experienceLevel());
        }
        if (request.learningGoals() != null) {
            profile.setLearningGoals(request.learningGoals());
        }
        if (request.githubUrl() != null) {
            profile.setGithubUrl(request.githubUrl());
        }
        if (request.linkedinUrl() != null) {
            profile.setLinkedinUrl(request.linkedinUrl());
        }
        if (request.portfolioUrl() != null) {
            profile.setPortfolioUrl(request.portfolioUrl());
        }
        if (request.skills() != null) {
            profile.setSkills(normalizeSkills(request.skills()));
        }

        return toResponse(userProfileRepository.save(profile));
    }

    @Transactional
    public UserProfileResponse rateUser(UUID ratedUserId, UUID raterUserId, CreateUserRatingRequest request) {
        if (ratedUserId.equals(raterUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot rate yourself");
        }

        userProfileRepository.findById(ratedUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        UserRating rating = userRatingRepository.findByRatedUserIdAndRaterUserId(ratedUserId, raterUserId)
            .orElseGet(UserRating::new);
        rating.setRatedUserId(ratedUserId);
        rating.setRaterUserId(raterUserId);
        rating.setScore(request.score());
        rating.setComment(request.comment());
        userRatingRepository.save(rating);

        UserProfile profile = userProfileRepository.findById(ratedUserId).orElseThrow();
        return toResponse(profile);
    }

    private Set<String> normalizeSkills(Set<String> skills) {
        return skills.stream()
            .map(skill -> skill.trim().toLowerCase(Locale.ROOT))
            .filter(skill -> !skill.isEmpty())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private UserProfileResponse toResponse(UserProfile profile) {
        double averageRating = userRatingRepository.averageScore(profile.getId());
        long ratingCount = userRatingRepository.countByRatedUserId(profile.getId());
        return new UserProfileResponse(
            profile.getId(),
            profile.getUsername(),
            profile.getDisplayName(),
            profile.getBio(),
            profile.getAvatarUrl(),
            profile.getLocation(),
            profile.getRole(),
            profile.getExperienceLevel(),
            profile.getLearningGoals(),
            profile.getGithubUrl(),
            profile.getLinkedinUrl(),
            profile.getPortfolioUrl(),
            Set.copyOf(profile.getSkills()),
            averageRating,
            ratingCount,
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }
}
