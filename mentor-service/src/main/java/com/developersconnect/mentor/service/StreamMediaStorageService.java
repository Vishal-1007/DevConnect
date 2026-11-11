package com.developersconnect.mentor.service;

import com.developersconnect.mentor.config.StreamMediaProperties;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StreamMediaStorageService {

    private static final Set<String> VIDEO_EXTENSIONS = Set.of("mp4", "webm", "mov");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> RESOURCE_EXTENSIONS = Set.of("pdf", "docx", "ppt", "pptx", "zip");
    private static final Set<String> MENTOR_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> MENTOR_DOCUMENT_EXTENSIONS = Set.of("pdf", "doc", "docx", "jpg", "jpeg", "png");
    private static final Set<String> RESUME_EXTENSIONS = Set.of("pdf", "docx", "doc");

    private final StreamMediaProperties properties;

    public StreamMediaStorageService(StreamMediaProperties properties) {
        this.properties = properties;
    }

    public String storeVideo(MultipartFile file) {
        validateVideo(file);
        return store(file, "videos", VIDEO_EXTENSIONS);
    }

    public String storeThumbnail(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return store(file, "thumbnails", IMAGE_EXTENSIONS);
    }

    public String storeResource(MultipartFile file) {
        validateResource(file);
        return store(file, "resources", RESOURCE_EXTENSIONS);
    }

    public String storeMentorApplicationImage(MultipartFile file) {
        validateMentorImage(file);
        return store(file, "mentor-applications/images", MENTOR_IMAGE_EXTENSIONS);
    }

    public String storeMentorApplicationDocument(MultipartFile file) {
        validateMentorDocument(file);
        return store(file, "mentor-applications/documents", MENTOR_DOCUMENT_EXTENSIONS);
    }

    public String storeResume(MultipartFile file) {
        validateResume(file);
        return store(file, "ai-interviews/resumes", RESUME_EXTENSIONS);
    }

    public Path resolveStoredPath(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found");
        }
        Path base = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Path resolved = base.resolve(relativePath).normalize();
        if (!resolved.startsWith(base)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid media path");
        }
        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media file missing");
        }
        return resolved;
    }

    public boolean isLocalMedia(String value) {
        return value != null
            && !value.isBlank()
            && !value.startsWith("http://")
            && !value.startsWith("https://");
    }

    private void validateVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video file is required");
        }
        if (file.getSize() > properties.getMaxVideoBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video exceeds maximum upload size");
        }
        String ext = extension(file.getOriginalFilename());
        if (!VIDEO_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported video format");
        }
    }

    private void validateResource(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource file is required");
        }
        if (file.getSize() > properties.getMaxVideoBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resource exceeds maximum upload size");
        }
        String ext = extension(file.getOriginalFilename());
        if (!RESOURCE_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource format");
        }
    }

    private void validateMentorImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image exceeds 5MB limit");
        }
        String ext = extension(file.getOriginalFilename());
        if (!MENTOR_IMAGE_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPG and PNG images are supported");
        }
    }

    private void validateMentorDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document file is required");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document exceeds 10MB limit");
        }
    }

    private void validateResume(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file is required");
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume exceeds 10MB limit");
        }
        String ext = extension(file.getOriginalFilename());
        if (!RESUME_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF and DOCX resumes are supported");
        }
    }

    private String store(MultipartFile file, String folder, Set<String> allowedExtensions) {
        String ext = extension(file.getOriginalFilename());
        if (!allowedExtensions.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file format");
        }
        try {
            Path dir = Path.of(properties.getUploadDir(), folder).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + ext;
            Path target = dir.resolve(filename);
            file.transferTo(target);
            return folder + "/" + filename;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file");
        }
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
