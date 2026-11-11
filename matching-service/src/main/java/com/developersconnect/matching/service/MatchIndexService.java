package com.developersconnect.matching.service;

import com.developersconnect.matching.dto.UpsertMatchIndexRequest;
import com.developersconnect.matching.model.UserMatchIndex;
import com.developersconnect.matching.repository.UserMatchIndexRepository;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchIndexService {

    private final UserMatchIndexRepository userMatchIndexRepository;

    public MatchIndexService(UserMatchIndexRepository userMatchIndexRepository) {
        this.userMatchIndexRepository = userMatchIndexRepository;
    }

    @Transactional
    public void upsert(UUID userId, UpsertMatchIndexRequest request) {
        UserMatchIndex index = userMatchIndexRepository.findById(userId).orElseGet(UserMatchIndex::new);
        index.setUserId(userId);
        if (request.experienceLevel() != null) {
            index.setExperienceLevel(request.experienceLevel().trim().toLowerCase(Locale.ROOT));
        }
        if (request.skills() != null) {
            index.setSkills(normalizeSkills(request.skills()));
        }
        userMatchIndexRepository.save(index);
    }

    private Set<String> normalizeSkills(Set<String> skills) {
        return skills.stream()
            .map(skill -> skill.trim().toLowerCase(Locale.ROOT))
            .filter(skill -> !skill.isEmpty())
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
