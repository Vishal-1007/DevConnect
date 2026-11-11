package com.developersconnect.matching.service;

import com.developersconnect.matching.dto.CreateMatchRequest;
import com.developersconnect.matching.dto.MatchRequestResponse;
import com.developersconnect.matching.dto.MatchResultResponse;
import com.developersconnect.matching.model.MatchRequest;
import com.developersconnect.matching.model.MatchResult;
import com.developersconnect.matching.repository.MatchRequestRepository;
import com.developersconnect.matching.repository.MatchResultRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MatchingService {

    private static final String STATUS_OPEN = "OPEN";
    private static final String STATUS_MATCHED = "MATCHED";
    private static final int MAX_RESULTS = 10;
    private static final Duration ACTIVE_REQUEST_WINDOW = Duration.ofMinutes(10);

    private final MatchRequestRepository matchRequestRepository;
    private final MatchResultRepository matchResultRepository;

    public MatchingService(
        MatchRequestRepository matchRequestRepository,
        MatchResultRepository matchResultRepository
    ) {
        this.matchRequestRepository = matchRequestRepository;
        this.matchResultRepository = matchResultRepository;
    }

    @Transactional
    public MatchRequestResponse createRequest(UUID requesterId, CreateMatchRequest request) {
        MatchRequest matchRequest = new MatchRequest();
        matchRequest.setRequesterId(requesterId);
        matchRequest.setCriteria(request.criteria());
        matchRequest.setStatus(STATUS_OPEN);

        MatchRequest saved = matchRequestRepository.save(matchRequest);
        List<ScoredCandidate> candidates = findCandidates(requesterId, request);
        List<MatchResult> results = new ArrayList<>();

        for (ScoredCandidate candidate : candidates) {
            MatchResult result = new MatchResult();
            result.setRequestId(saved.getId());
            result.setMatchedUserId(candidate.getUserId());
            result.setScore(candidate.getScore());
            results.add(matchResultRepository.save(result));

            // Mirror the match into the partner's latest OPEN request so both sides can
            // discover each other (frontend fetches results per-request once).
            createReciprocalResultIfOpen(candidate.getUserId(), requesterId, candidate.getScore());
        }

        if (!results.isEmpty()) {
            saved.setStatus(STATUS_MATCHED);
            matchRequestRepository.save(saved);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MatchRequestResponse> listRequests(UUID requesterId) {
        return matchRequestRepository.findAllByRequesterIdOrderByCreatedAtDesc(requesterId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatchResultResponse> listResults(UUID requesterId, UUID requestId) {
        MatchRequest request = matchRequestRepository.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match request not found"));

        if (!request.getRequesterId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        return matchResultRepository.findAllByRequestId(requestId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private List<ScoredCandidate> findCandidates(UUID requesterId, CreateMatchRequest request) {
        Instant activeCutoff = Instant.now().minus(ACTIVE_REQUEST_WINDOW);

        // Only match to recently active requesters. This avoids stale/demo index entries
        // causing "black remote video" where a non-live placeholder account gets selected.
        return findRecentActiveRequesters(requesterId, activeCutoff);
    }

    /** Users who recently clicked Find Match / Start Session — highest priority for live pairing. */
    private List<ScoredCandidate> findRecentActiveRequesters(UUID requesterId, Instant activeCutoff) {
        return matchRequestRepository.findRecentByOtherRequesters(requesterId).stream()
            .filter(r -> r.getCreatedAt() != null)
            .filter(r -> r.getCreatedAt().isAfter(activeCutoff))
            .filter(r -> STATUS_OPEN.equalsIgnoreCase(r.getStatus()))
            .map(MatchRequest::getRequesterId)
            .distinct()
            .limit(MAX_RESULTS)
            .map(id -> new ScoredCandidate(id, 1000.0))
            .collect(Collectors.toList());
    }

    private void createReciprocalResultIfOpen(UUID requesterId, UUID matchedUserId, double score) {
        MatchRequest reciprocalRequest = matchRequestRepository
            .findTop10ByRequesterIdAndStatusOrderByCreatedAtDesc(requesterId, STATUS_OPEN)
            .stream()
            .findFirst()
            .orElse(null);

        if (reciprocalRequest == null) {
            return;
        }

        if (!matchResultRepository.existsByRequestIdAndMatchedUserId(reciprocalRequest.getId(), matchedUserId)) {
            MatchResult reciprocalResult = new MatchResult();
            reciprocalResult.setRequestId(reciprocalRequest.getId());
            reciprocalResult.setMatchedUserId(matchedUserId);
            reciprocalResult.setScore(score);
            matchResultRepository.save(reciprocalResult);
        }

        reciprocalRequest.setStatus(STATUS_MATCHED);
        matchRequestRepository.save(reciprocalRequest);
    }

    private MatchRequestResponse toResponse(MatchRequest request) {
        return new MatchRequestResponse(
            request.getId(),
            request.getRequesterId(),
            request.getStatus(),
            request.getCriteria(),
            request.getCreatedAt(),
            request.getUpdatedAt()
        );
    }

    private MatchResultResponse toResponse(MatchResult result) {
        return new MatchResultResponse(
            result.getId(),
            result.getRequestId(),
            result.getMatchedUserId(),
            result.getScore(),
            result.getCreatedAt()
        );
    }

    /** Simple holder — avoids IDE issues some users see with nested records. */
    private static final class ScoredCandidate {
        private final UUID userId;
        private final double score;

        private ScoredCandidate(UUID userId, double score) {
            this.userId = userId;
            this.score = score;
        }

        private UUID getUserId() {
            return userId;
        }

        private double getScore() {
            return score;
        }
    }
}
