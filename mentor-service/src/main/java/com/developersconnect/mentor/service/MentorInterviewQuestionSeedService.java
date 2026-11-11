package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.MentorInterviewQuestion;
import com.developersconnect.mentor.repository.MentorInterviewQuestionRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorInterviewQuestionSeedService {

    private final MentorInterviewQuestionRepository questionRepository;

    public MentorInterviewQuestionSeedService(MentorInterviewQuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @Transactional
    public void ensurePlatformLibrary() {
        if (questionRepository.countByMentorIdIsNull() > 0) {
            return;
        }

        seed("dsa", "medium",
            "Explain time/space complexity of quicksort. When would you avoid it?",
            "1. Best vs worst case?\n2. In-place requirements?\n3. Stable sort needed?",
            "Expect pivot selection, average O(n log n), and recursion depth concerns.");
        seed("dsa", "hard",
            "Implement LRU Cache using HashMap + DoublyLinkedList.",
            "1. Thread safety?\n2. Eviction policy customization?\n3. TTL support?",
            "Verify O(1) get/put and correct pointer updates.");
        seed("system_design", "hard",
            "Design a URL shortener like bit.ly. Scale to 1 billion URLs.",
            "1. Custom aliases?\n2. Analytics requirements?\n3. Expiration policy?",
            "Look for base62 encoding, DB sharding, and cache strategy.");
        seed("system_design", "hard",
            "Design a real-time chat application (WhatsApp scale).",
            "1. Delivery guarantees?\n2. Group chat fan-out?\n3. Offline message sync?",
            "Assess websocket gateways, message queues, and presence systems.");
        seed("java", "medium",
            "Explain the difference between HashMap and ConcurrentHashMap.",
            "1. Null key/value support?\n2. Iteration behavior?\n3. Size visibility?",
            "Check concurrency semantics and fail-fast vs weakly consistent iterators.");
        seed("java", "hard",
            "What is the Java Memory Model? Explain volatile and synchronized.",
            "1. Happens-before examples?\n2. Double-checked locking?\n3. Visibility vs atomicity?",
            "Strong answers include reordering examples and practical debugging.");
        seed("react", "medium",
            "Explain React reconciliation and the Virtual DOM diffing algorithm.",
            "1. Keys in lists?\n2. Reconciliation vs rerender?\n3. Concurrent features impact?",
            "Evaluate understanding of render phases and key stability.");
        seed("react", "medium",
            "When would you use useCallback vs useMemo? Give real examples.",
            "1. Dependency pitfalls?\n2. Child memoization?\n3. Premature optimization risks?",
            "Reward precise guidance, not blanket memoization.");
        seed("spring_boot", "medium",
            "Explain Spring bean lifecycle and scopes.",
            "1. @PostConstruct usage?\n2. Prototype in singleton injection?\n3. Circular dependencies?",
            "Check awareness of container lifecycle hooks.");
        seed("spring_boot", "hard",
            "How would you implement distributed transactions across microservices?",
            "1. Saga choreography vs orchestration?\n2. Idempotency?\n3. Outbox pattern?",
            "Prefer eventual consistency patterns over 2PC.");
        seed("hr", "easy",
            "Tell me about a time you failed. What did you learn?",
            "1. What was your role?\n2. How did you recover?\n3. What changed afterward?",
            "Use STAR; reward accountability and growth.");
        seed("hr", "easy",
            "Describe your biggest technical achievement in the last 2 years.",
            "1. Measurable impact?\n2. Team collaboration?\n3. What would you improve now?",
            "Look for impact metrics and reflection.");
    }

    private void seed(
        String category,
        String difficulty,
        String questionText,
        String followUps,
        String evaluationHints
    ) {
        MentorInterviewQuestion question = new MentorInterviewQuestion();
        question.setMentorId(null);
        question.setCategory(category);
        question.setDifficulty(difficulty);
        question.setQuestionText(questionText);
        question.setFollowUps(followUps);
        question.setEvaluationHints(evaluationHints);
        question.setAiGenerated(false);
        question.setTemplate(false);
        questionRepository.save(question);
    }
}
