package com.developersconnect.user.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.developersconnect.user.dto.CommunityEventResponse;
import com.developersconnect.user.dto.EventSpeakerResponse;
import com.developersconnect.user.model.CommunityEvent;
import com.developersconnect.user.model.UserProfile;
import com.developersconnect.user.repository.CommunityEventRegistrationRepository;
import com.developersconnect.user.repository.UserProfileRepository;

@Component
public class EventResponseMapper {

    private final CommunityEventRegistrationRepository registrationRepository;
    private final UserProfileRepository userProfileRepository;
    private final EventCommerceService commerceService;

    public EventResponseMapper(
        CommunityEventRegistrationRepository registrationRepository,
        UserProfileRepository userProfileRepository,
        EventCommerceService commerceService
    ) {
        this.registrationRepository = registrationRepository;
        this.userProfileRepository = userProfileRepository;
        this.commerceService = commerceService;
    }

    public CommunityEventResponse toResponse(CommunityEvent event, UUID viewerId) {
        UserProfile host = userProfileRepository.findById(event.getHostId()).orElse(null);
        String hostName = resolveDisplayName(host);
        long attendeeCount = registrationRepository.countByEventId(event.getId());
        boolean registered = registrationRepository.existsByEventIdAndUserId(event.getId(), viewerId);
        boolean full = attendeeCount >= event.getMaxAttendees();
        boolean hasAccess = registered || event.getHostId().equals(viewerId);
        boolean locked = event.isPaid() && !hasAccess;

        return new CommunityEventResponse(
            event.getId(),
            event.getHostId(),
            hostName,
            host != null ? host.getRole() : null,
            event.getTitle(),
            event.getDescription(),
            event.getEventType(),
            event.getCategory(),
            event.getFormat(),
            locked ? null : event.getLocationOrLink(),
            event.getStartsAt(),
            event.getEndsAt(),
            event.getMaxAttendees(),
            attendeeCount,
            registered,
            full,
            resolveSpeakers(event),
            Set.copyOf(event.getTags()),
            event.getCreatedAt(),
            resolveThumbnail(event),
            event.isPaid(),
            event.getPriceInrCents() / 100,
            event.isFeatured(),
            event.getHostApprovalStatus(),
            commerceService.isBookmarked(event.getId(), viewerId),
            hasAccess,
            locked,
            event.getTopicsCovered(),
            event.getRequirements(),
            4.8
        );
    }

    public String resolveDisplayName(UserProfile profile) {
        if (profile == null) {
            return "Developer";
        }
        if (profile.getDisplayName() != null) {
            return profile.getDisplayName();
        }
        return profile.getUsername();
    }

    private String resolveThumbnail(CommunityEvent event) {
        if (event.getThumbnailUrl() != null && !event.getThumbnailUrl().isBlank()) {
            return event.getThumbnailUrl();
        }
        return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&h=360&fit=crop";
    }

    private List<EventSpeakerResponse> resolveSpeakers(CommunityEvent event) {
        List<EventSpeakerResponse> speakers = new ArrayList<>();
        for (UUID speakerId : event.getSpeakerIds()) {
            UserProfile profile = userProfileRepository.findById(speakerId).orElse(null);
            speakers.add(new EventSpeakerResponse(
                speakerId,
                resolveDisplayName(profile),
                profile != null ? profile.getRole() : null
            ));
        }
        return speakers;
    }
}
