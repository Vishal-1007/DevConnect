package com.developersconnect.mentor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MentorStudentDetailResponse(
    UUID learnerId,
    String name,
    String role,
    int sessions,
    int progressPct,
    String weakArea,
    String strongArea,
    String status,
    String lastSessionLabel,
    Instant lastSessionAt,
    String category,
    String categoryLabel,
    int interviewReadinessPct,
    String interviewTarget,
    String notes,
    int assignedTaskCount,
    int pendingTaskCount,
    int improvementPct,
    List<MentorStudentSessionHistoryItem> sessionHistory,
    List<MentorStudentTaskResponse> tasks,
    List<MentorStudentRoadmapItemResponse> roadmap,
    List<MentorStudentImprovementPoint> improvementTrend
) {}
