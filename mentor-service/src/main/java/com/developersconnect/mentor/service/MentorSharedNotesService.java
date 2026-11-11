package com.developersconnect.mentor.service;

import com.developersconnect.mentor.dto.CreateMentorSharedNoteRequest;
import com.developersconnect.mentor.dto.MentorSharedNoteFileResponse;
import com.developersconnect.mentor.dto.MentorSharedNoteResponse;
import com.developersconnect.mentor.dto.ShareMentorSharedNoteRequest;
import com.developersconnect.mentor.dto.UpdateMentorSharedNoteRequest;
import com.developersconnect.mentor.model.MentorSharedNote;
import com.developersconnect.mentor.repository.MentorSharedNoteRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MentorSharedNotesService {

    private static final String TAG_DELIM = ",";
    private static final String LEARNER_DELIM = ",";
    private static final int MAX_FILE_BYTES = 5 * 1024 * 1024;
    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US).withZone(ZoneId.systemDefault());

    private static final Map<String, String> TYPE_LABELS = Map.of(
        "note", "Note",
        "pdf", "PDF",
        "interview_question", "Interview Question",
        "roadmap", "Roadmap",
        "code_sample", "Code Sample"
    );
    private static final Set<String> MATERIAL_TYPES = TYPE_LABELS.keySet();

    private final MentorSharedNoteRepository noteRepository;
    private final MentorProfileService mentorProfileService;

    public MentorSharedNotesService(
        MentorSharedNoteRepository noteRepository,
        MentorProfileService mentorProfileService
    ) {
        this.noteRepository = noteRepository;
        this.mentorProfileService = mentorProfileService;
    }

    @Transactional(readOnly = true)
    public List<MentorSharedNoteResponse> listNotes(UUID mentorId, String type, String search) {
        requireApprovedMentor(mentorId);
        String normalizedType = normalize(type, "all");
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        return noteRepository.findByMentorIdOrderByUpdatedAtDesc(mentorId).stream()
            .filter(note -> "all".equals(normalizedType) || note.getMaterialType().equals(normalizedType))
            .filter(note -> matchesSearch(note, query))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public MentorSharedNoteResponse getNote(UUID mentorId, UUID noteId) {
        requireApprovedMentor(mentorId);
        return toResponse(requireNote(mentorId, noteId));
    }

    @Transactional(readOnly = true)
    public MentorSharedNoteFileResponse getNoteFile(UUID mentorId, UUID noteId) {
        requireApprovedMentor(mentorId);
        MentorSharedNote note = requireNote(mentorId, noteId);
        if (note.getFileDataBase64() == null || note.getFileDataBase64().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No file attached to this note");
        }
        return new MentorSharedNoteFileResponse(
            note.getId(),
            note.getFileName(),
            note.getFileMimeType(),
            note.getFileSizeBytes(),
            note.getFileDataBase64()
        );
    }

    @Transactional
    public MentorSharedNoteResponse createNote(UUID mentorId, CreateMentorSharedNoteRequest request) {
        requireApprovedMentor(mentorId);
        validateMaterialType(request.materialType());

        MentorSharedNote note = new MentorSharedNote();
        note.setMentorId(mentorId);
        note.setTitle(request.title().trim());
        note.setContent(trimOrNull(request.content()));
        note.setMaterialType(request.materialType().trim().toLowerCase(Locale.ROOT));
        note.setTags(encodeTags(request.tags()));
        note.setLinkedBookingId(request.linkedBookingId());
        note.setPublished(request.published());
        note.setSharedWithLearnerIds(encodeLearnerIds(request.sharedWithLearnerIds()));

        applyFile(note, request.fileName(), request.fileMimeType(), request.fileDataBase64(), false);

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public MentorSharedNoteResponse updateNote(UUID mentorId, UUID noteId, UpdateMentorSharedNoteRequest request) {
        requireApprovedMentor(mentorId);
        MentorSharedNote note = requireNote(mentorId, noteId);

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title cannot be blank");
            }
            note.setTitle(request.title().trim());
        }
        if (request.content() != null) {
            note.setContent(trimOrNull(request.content()));
        }
        if (request.materialType() != null) {
            validateMaterialType(request.materialType());
            note.setMaterialType(request.materialType().trim().toLowerCase(Locale.ROOT));
        }
        if (request.tags() != null) {
            note.setTags(encodeTags(request.tags()));
        }
        if (request.sharedWithLearnerIds() != null) {
            note.setSharedWithLearnerIds(encodeLearnerIds(request.sharedWithLearnerIds()));
        }
        if (request.linkedBookingId() != null) {
            note.setLinkedBookingId(request.linkedBookingId());
        }
        if (request.published() != null) {
            note.setPublished(request.published());
        }

        boolean clearFile = Boolean.TRUE.equals(request.clearFile());
        applyFile(note, request.fileName(), request.fileMimeType(), request.fileDataBase64(), clearFile);

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public MentorSharedNoteResponse shareNote(UUID mentorId, UUID noteId, ShareMentorSharedNoteRequest request) {
        requireApprovedMentor(mentorId);
        MentorSharedNote note = requireNote(mentorId, noteId);

        Set<UUID> merged = new LinkedHashSet<>(decodeLearnerIds(note.getSharedWithLearnerIds()));
        merged.addAll(request.learnerIds());
        note.setSharedWithLearnerIds(encodeLearnerIds(new ArrayList<>(merged)));
        note.setPublished(true);

        if (request.message() != null && !request.message().isBlank() && note.getContent() == null) {
            note.setContent(request.message().trim());
        }

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void deleteNote(UUID mentorId, UUID noteId) {
        requireApprovedMentor(mentorId);
        MentorSharedNote note = requireNote(mentorId, noteId);
        noteRepository.delete(note);
    }

    private MentorSharedNote requireNote(UUID mentorId, UUID noteId) {
        return noteRepository.findByIdAndMentorId(noteId, mentorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared note not found"));
    }

    private void applyFile(
        MentorSharedNote note,
        String fileName,
        String fileMimeType,
        String fileDataBase64,
        boolean clearFile
    ) {
        if (clearFile) {
            note.setFileName(null);
            note.setFileMimeType(null);
            note.setFileSizeBytes(null);
            note.setFileDataBase64(null);
            return;
        }
        if (fileDataBase64 == null || fileDataBase64.isBlank()) {
            return;
        }
        String payload = stripDataUrlPrefix(fileDataBase64.trim());
        int approxBytes = (int) (payload.length() * 0.75);
        if (approxBytes > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds 5 MB limit");
        }
        note.setFileName(fileName != null ? fileName.trim() : "attachment");
        note.setFileMimeType(fileMimeType != null ? fileMimeType.trim() : "application/octet-stream");
        note.setFileSizeBytes((long) approxBytes);
        note.setFileDataBase64(payload);
    }

    private MentorSharedNoteResponse toResponse(MentorSharedNote note) {
        List<UUID> sharedIds = decodeLearnerIds(note.getSharedWithLearnerIds());
        return new MentorSharedNoteResponse(
            note.getId(),
            note.getTitle(),
            note.getContent(),
            note.getMaterialType(),
            TYPE_LABELS.getOrDefault(note.getMaterialType(), "Note"),
            decodeTags(note.getTags()),
            note.getFileName(),
            note.getFileMimeType(),
            note.getFileSizeBytes(),
            note.getFileDataBase64() != null && !note.getFileDataBase64().isBlank(),
            sharedIds,
            sharedIds.size(),
            note.getLinkedBookingId(),
            note.isPublished(),
            DATE_FMT.format(note.getCreatedAt()),
            DATE_FMT.format(note.getUpdatedAt())
        );
    }

    private boolean matchesSearch(MentorSharedNote note, String query) {
        if (query.isBlank()) {
            return true;
        }
        return note.getTitle().toLowerCase(Locale.ROOT).contains(query)
            || (note.getContent() != null && note.getContent().toLowerCase(Locale.ROOT).contains(query))
            || decodeTags(note.getTags()).stream().anyMatch(t -> t.toLowerCase(Locale.ROOT).contains(query));
    }

    private void validateMaterialType(String materialType) {
        if (materialType == null || !MATERIAL_TYPES.contains(materialType.trim().toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid material type");
        }
    }

    private String encodeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return tags.stream()
            .map(String::trim)
            .filter(t -> !t.isBlank())
            .collect(Collectors.joining(TAG_DELIM));
    }

    private List<String> decodeTags(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(TAG_DELIM))
            .map(String::trim)
            .filter(t -> !t.isBlank())
            .toList();
    }

    private String encodeLearnerIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }
        return ids.stream().map(UUID::toString).collect(Collectors.joining(LEARNER_DELIM));
    }

    private List<UUID> decodeLearnerIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        List<UUID> ids = new ArrayList<>();
        for (String part : raw.split(LEARNER_DELIM)) {
            try {
                ids.add(UUID.fromString(part.trim()));
            } catch (IllegalArgumentException ignored) {
                // skip invalid ids
            }
        }
        return ids;
    }

    private String stripDataUrlPrefix(String value) {
        int comma = value.indexOf(',');
        if (value.startsWith("data:") && comma >= 0) {
            return value.substring(comma + 1);
        }
        return value;
    }

    private String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private void requireApprovedMentor(UUID mentorId) {
        if (!mentorProfileService.getMentorAccess(mentorId).canAccess()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mentor workspace access denied");
        }
    }
}
