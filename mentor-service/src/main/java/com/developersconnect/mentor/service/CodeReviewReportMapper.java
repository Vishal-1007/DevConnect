package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CodeReviewDtos;
import com.developersconnect.mentor.dto.CodeReviewDtos.AnalyzeCodeReviewRequest;
import com.developersconnect.mentor.dto.CodeReviewDtos.CategoryScoresDto;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewIssueDto;
import com.developersconnect.mentor.dto.CodeReviewDtos.CodeReviewReportResponse;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class CodeReviewReportMapper {

    private CodeReviewReportMapper() {}

    static CodeReviewReportResponse fromJson(JsonNode node, AnalyzeCodeReviewRequest submission, String source) {
        double overall = node.path("overallScore").asDouble(7.0);
        JsonNode scoresNode = node.path("scores");
        Map<String, Double> map = new HashMap<>();
        map.put("security", scoresNode.path("security").asDouble(0));
        map.put("performance", scoresNode.path("performance").asDouble(0));
        map.put("architecture", scoresNode.path("architecture").asDouble(0));
        map.put("clean-code", scoresNode.path("cleanCode").asDouble(scoresNode.path("clean-code").asDouble(0)));
        map.put("interview-standard", scoresNode.path("interviewStandard").asDouble(
            scoresNode.path("interview-standard").asDouble(0)
        ));
        CategoryScoresDto scores = CodeReviewDtos.fromMap(map);

        return new CodeReviewReportResponse(
            round(overall),
            scores,
            mapIssues(node.path("critical"), "critical"),
            mapIssues(node.path("improvements"), "improvement"),
            mapIssues(node.path("goodPractices"), "good"),
            node.path("summary").asText("Analysis complete."),
            submission,
            source
        );
    }

    private static List<CodeReviewIssueDto> mapIssues(JsonNode array, String defaultSeverity) {
        List<CodeReviewIssueDto> list = new ArrayList<>();
        if (!array.isArray()) return list;
        int i = 0;
        for (JsonNode item : array) {
            list.add(new CodeReviewIssueDto(
                item.path("id").asText("issue-" + (++i)),
                item.path("severity").asText(defaultSeverity),
                item.path("category").asText("clean-code"),
                item.path("problem").asText("Issue"),
                item.path("explanation").asText(""),
                item.path("solution").asText(""),
                item.has("codeSuggestion") && !item.path("codeSuggestion").isNull()
                    ? item.path("codeSuggestion").asText(null)
                    : null
            ));
        }
        return list;
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
