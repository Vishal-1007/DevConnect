package com.developersconnect.user.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.developersconnect.user.config.CommunityUploadProperties;
import com.developersconnect.user.dto.CommunityPostUploadResponse;
import com.developersconnect.user.model.CommunityPostFile;
import com.developersconnect.user.repository.CommunityPostFileRepository;

@Service
public class CommunityPostFileStorageService {

    private static final Set<String> IMAGE_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");
    private static final Set<String> ATTACHMENT_EXTENSIONS = Set.of("pdf", "doc", "docx", "txt", "zip");

    private final CommunityUploadProperties properties;
    private final CommunityPostFileRepository fileRepository;

    public CommunityPostFileStorageService(
        CommunityUploadProperties properties,
        CommunityPostFileRepository fileRepository
    ) {
        this.properties = properties;
        this.fileRepository = fileRepository;
    }

    @Transactional
    public CommunityPostUploadResponse store(UUID uploaderId, MultipartFile file, String kind) {
        String normalizedKind = kind == null ? "" : kind.trim().toLowerCase(Locale.ROOT);
        if ("image".equals(normalizedKind)) {
            return storeImage(uploaderId, file);
        }
        if ("attachment".equals(normalizedKind)) {
            return storeAttachment(uploaderId, file);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload kind must be image or attachment");
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(UUID fileId) {
        CommunityPostFile record = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        try {
            Path path = resolveStoredPath(record.getStoredPath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing on disk");
            }
            return resource;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read file");
        }
    }

    @Transactional(readOnly = true)
    public CommunityPostFile findFile(UUID fileId) {
        return fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public String publicUrlFor(CommunityPostFile file) {
        return "/uploads/community/" + file.getStoredPath().replace('\\', '/');
    }

    public String downloadUrlFor(UUID fileId) {
        return "/api/files/download/" + fileId;
    }

    private CommunityPostUploadResponse storeImage(UUID uploaderId, MultipartFile file) {
        validatePresent(file);
        if (file.getSize() > properties.getMaxImageBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image size should be less than 5MB");
        }
        String ext = extension(file.getOriginalFilename());
        if (!IMAGE_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PNG, JPG, JPEG, and WEBP images are supported");
        }
        return persist(uploaderId, file, "images", ext, "image", file.getContentType());
    }

    private CommunityPostUploadResponse storeAttachment(UUID uploaderId, MultipartFile file) {
        validatePresent(file);
        if (file.getSize() > properties.getMaxAttachmentBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment size should be less than 20MB");
        }
        String ext = extension(file.getOriginalFilename());
        if (!ATTACHMENT_EXTENSIONS.contains(ext)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only PDF, DOC, DOCX, TXT, and ZIP attachments are supported"
            );
        }
        return persist(uploaderId, file, "attachments", ext, "attachment", file.getContentType());
    }

    private CommunityPostUploadResponse persist(
        UUID uploaderId,
        MultipartFile file,
        String folder,
        String ext,
        String kind,
        String mimeType
    ) {
        try {
            Path dir = Path.of(properties.getUploadDir(), folder).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + ext;
            Path target = dir.resolve(filename);
            file.transferTo(target);

            String storedPath = folder + "/" + filename;
            CommunityPostFile record = new CommunityPostFile();
            record.setUploaderId(uploaderId);
            record.setStoredPath(storedPath);
            record.setOriginalName(sanitizeFilename(file.getOriginalFilename()));
            record.setMimeType(mimeType != null && !mimeType.isBlank() ? mimeType : "application/octet-stream");
            record.setSizeBytes(file.getSize());
            record.setFileKind(kind.toUpperCase(Locale.ROOT));
            CommunityPostFile saved = fileRepository.save(record);

            String url = kind.equals("image")
                ? publicUrlFor(saved)
                : downloadUrlFor(saved.getId());

            return new CommunityPostUploadResponse(
                saved.getId(),
                url,
                saved.getOriginalName(),
                saved.getSizeBytes(),
                saved.getMimeType(),
                kind
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file");
        }
    }

    private Path resolveStoredPath(String relativePath) {
        Path base = Path.of(properties.getUploadDir()).toAbsolutePath().normalize();
        Path resolved = base.resolve(relativePath).normalize();
        if (!resolved.startsWith(base)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }
        if (!Files.exists(resolved) || !Files.isRegularFile(resolved)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing");
        }
        return resolved;
    }

    private void validatePresent(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }
        return filename.replaceAll("[\\\\/]", "_").trim();
    }
}
