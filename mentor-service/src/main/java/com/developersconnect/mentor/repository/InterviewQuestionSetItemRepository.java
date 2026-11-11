package com.developersconnect.mentor.repository;

import com.developersconnect.mentor.model.InterviewQuestionSetItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewQuestionSetItemRepository extends JpaRepository<InterviewQuestionSetItem, InterviewQuestionSetItem.ItemId> {

    List<InterviewQuestionSetItem> findByQuestionSetIdOrderBySortOrderAsc(UUID questionSetId);

    void deleteByQuestionSetId(UUID questionSetId);

    long countByQuestionSetId(UUID questionSetId);
}
