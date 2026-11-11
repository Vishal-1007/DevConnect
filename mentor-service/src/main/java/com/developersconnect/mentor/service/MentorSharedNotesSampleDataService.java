package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.MentorSharedNote;
import com.developersconnect.mentor.repository.MentorSharedNoteRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorSharedNotesSampleDataService {

    private final MentorSharedNoteRepository noteRepository;

    public MentorSharedNotesSampleDataService(MentorSharedNoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @Transactional
    public void ensureSampleNotesIfEmpty(UUID mentorId) {
        if (noteRepository.countByMentorId(mentorId) > 0) {
            return;
        }

        create(mentorId, "System Design Session Recap",
            """
            ## Key takeaways from our session
            - Start with requirements and scale estimates
            - Draw high-level components before deep-diving
            - Discuss trade-offs: consistency vs availability
            - Practice explaining your design in 15 minutes
            """,
            "note", "system-design,recap,post-session", true);

        create(mentorId, "Binary Search Patterns Cheat Sheet",
            """
            // Template for lower bound
            int lo = 0, hi = n - 1;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (predicate(mid)) hi = mid;
                else lo = mid + 1;
            }
            return lo;
            """,
            "code_sample", "dsa,binary-search,java", true);

        create(mentorId, "Mock Interview: LRU Cache",
            """
            **Question:** Implement an LRU Cache with O(1) get/put.

            **Follow-ups:**
            1. How would you make it thread-safe?
            2. What if cache size is dynamic?
            3. How to persist cache across restarts?

            **Evaluation rubric:** correctness, complexity analysis, edge cases, clean API design.
            """,
            "interview_question", "interview,lru,cache", false);

        create(mentorId, "8-Week Backend Interview Roadmap",
            """
            Week 1-2: DSA fundamentals (arrays, trees, graphs)
            Week 3: System design basics (URL shortener, rate limiter)
            Week 4: Java/Spring deep dive
            Week 5: Mock interviews + feedback
            Week 6: Distributed systems patterns
            Week 7: Behavioral + resume review
            Week 8: Company-specific prep
            """,
            "roadmap", "roadmap,backend,8-week", false);
    }

    private void create(
        UUID mentorId,
        String title,
        String content,
        String materialType,
        String tags,
        boolean published
    ) {
        MentorSharedNote note = new MentorSharedNote();
        note.setMentorId(mentorId);
        note.setTitle(title);
        note.setContent(content.trim());
        note.setMaterialType(materialType);
        note.setTags(tags);
        note.setPublished(published);
        noteRepository.save(note);
    }
}
