package com.developersconnect.mentor.dto;

import java.util.List;
import java.util.UUID;

public record MentorStudentProgressHighlight(
    UUID learnerId,
    String name,
    int overallProgressPct,
    List<MentorTopicProgressItem> topics
) {}
