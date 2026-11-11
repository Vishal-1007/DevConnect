package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.AiInterviewDtos.ResumeParseResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;

@Service
public class ResumeParserService {

    private static final Set<String> COMMON_SKILLS = Set.of(
        "java", "spring", "spring boot", "react", "node", "nodejs", "python", "aws", "docker",
        "kubernetes", "postgresql", "mysql", "mongodb", "redis", "kafka", "microservices",
        "javascript", "typescript", "angular", "vue", "html", "css", "git", "rest", "graphql",
        "hibernate", "jpa", "sql", "nosql", "azure", "gcp", "linux", "ci/cd", "jenkins",
        "terraform", "system design", "devops", "c++", "c#", ".net", "go", "golang", "rust"
    );

    private static final Pattern EXPERIENCE_PATTERN = Pattern.compile(
        "(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of\\s*)?experience",
        Pattern.CASE_INSENSITIVE
    );

    private final ObjectMapper objectMapper;

    public ResumeParserService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ResumeParseResponse parse(Path filePath, String originalFilename) {
        String text = extractText(filePath, originalFilename);
        return parseText(text);
    }

    public ResumeParseResponse parseText(String text) {
        if (text == null || text.isBlank()) {
            return new ResumeParseResponse("", List.of(), "", List.of(), List.of(), List.of(), "", "");
        }

        String normalized = text.replace('\r', '\n');
        String[] lines = Arrays.stream(normalized.split("\n"))
            .map(String::trim)
            .filter(l -> !l.isBlank())
            .toArray(String[]::new);

        String username = lines.length > 0 ? lines[0].replaceAll("[^a-zA-Z\\s.-]", "").trim() : "";
        if (username.length() > 64) {
            username = username.substring(0, 64);
        }

        List<String> skills = extractSkills(normalized);
        String experience = extractExperience(normalized);
        List<String> projects = extractSectionItems(normalized, "project");
        List<String> companies = extractCompanies(normalized);
        List<String> technologies = skills.stream().limit(15).toList();
        String education = extractSectionBlock(normalized, "education");

        return new ResumeParseResponse(
            username,
            skills,
            experience,
            projects,
            companies,
            technologies,
            education,
            normalized.length() > 8000 ? normalized.substring(0, 8000) : normalized
        );
    }

    public String toJson(ResumeParseResponse data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception ex) {
            return "{}";
        }
    }

    public ResumeParseResponse fromJson(String json) {
        if (json == null || json.isBlank()) {
            return new ResumeParseResponse("", List.of(), "", List.of(), List.of(), List.of(), "", "");
        }
        try {
            return objectMapper.readValue(json, ResumeParseResponse.class);
        } catch (Exception ex) {
            return new ResumeParseResponse("", List.of(), "", List.of(), List.of(), List.of(), "", "");
        }
    }

    private String extractText(Path filePath, String originalFilename) {
        String ext = extension(originalFilename);
        try {
            if ("pdf".equals(ext)) {
                return extractPdf(filePath);
            }
            if ("docx".equals(ext)) {
                return extractDocx(filePath);
            }
            if ("doc".equals(ext)) {
                return extractDocx(filePath);
            }
            return java.nio.file.Files.readString(filePath);
        } catch (Exception ex) {
            return "";
        }
    }

    private String extractPdf(Path filePath) throws IOException {
        try (PDDocument doc = Loader.loadPDF(filePath.toFile())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private String extractDocx(Path filePath) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (InputStream in = java.nio.file.Files.newInputStream(filePath);
             XWPFDocument doc = new XWPFDocument(in)) {
            for (XWPFParagraph para : doc.getParagraphs()) {
                sb.append(para.getText()).append('\n');
            }
        }
        return sb.toString();
    }

    private List<String> extractSkills(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        Set<String> found = new LinkedHashSet<>();
        for (String skill : COMMON_SKILLS) {
            if (lower.contains(skill)) {
                found.add(formatSkill(skill));
            }
        }
        return new ArrayList<>(found);
    }

    private String formatSkill(String skill) {
        return switch (skill) {
            case "spring boot" -> "Spring Boot";
            case "nodejs", "node" -> "Node.js";
            case "ci/cd" -> "CI/CD";
            default -> skill.substring(0, 1).toUpperCase(Locale.ROOT) + skill.substring(1);
        };
    }

    private String extractExperience(String text) {
        Matcher m = EXPERIENCE_PATTERN.matcher(text);
        if (m.find()) {
            return m.group(1) + " Years";
        }
        if (text.toLowerCase(Locale.ROOT).contains("fresher")) {
            return "Fresher";
        }
        return "";
    }

    private List<String> extractSectionItems(String text, String sectionKeyword) {
        List<String> items = new ArrayList<>();
        String[] lines = text.split("\n");
        boolean inSection = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase(Locale.ROOT).contains(sectionKeyword)) {
                inSection = true;
                continue;
            }
            if (inSection) {
                if (trimmed.isBlank()) continue;
                if (isSectionHeader(trimmed)) break;
                if (trimmed.length() > 5 && trimmed.length() < 200) {
                    items.add(trimmed);
                }
                if (items.size() >= 5) break;
            }
        }
        return items;
    }

    private String extractSectionBlock(String text, String sectionKeyword) {
        String[] lines = text.split("\n");
        StringBuilder block = new StringBuilder();
        boolean inSection = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase(Locale.ROOT).contains(sectionKeyword)) {
                inSection = true;
                continue;
            }
            if (inSection) {
                if (isSectionHeader(trimmed)) break;
                if (!trimmed.isBlank()) {
                    block.append(trimmed).append(' ');
                }
            }
        }
        String result = block.toString().trim();
        return result.length() > 300 ? result.substring(0, 300) : result;
    }

    private List<String> extractCompanies(String text) {
        List<String> companies = new ArrayList<>();
        String[] known = {"Amazon", "Google", "Microsoft", "Meta", "Flipkart", "Infosys", "TCS", "Wipro"};
        for (String c : known) {
            if (text.contains(c)) companies.add(c);
        }
        return companies;
    }

    private boolean isSectionHeader(String line) {
        String lower = line.toLowerCase(Locale.ROOT);
        return lower.matches("^(skills|experience|education|projects|certifications|summary|objective).*")
            && line.length() < 40;
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
