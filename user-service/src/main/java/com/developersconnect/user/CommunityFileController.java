package com.developersconnect.user;

import com.developersconnect.user.model.CommunityPostFile;
import com.developersconnect.user.service.CommunityPostFileStorageService;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class CommunityFileController {

    private final CommunityPostFileStorageService fileStorageService;

    public CommunityFileController(CommunityPostFileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> download(@PathVariable UUID fileId) {
        CommunityPostFile file = fileStorageService.findFile(fileId);
        Resource resource = fileStorageService.loadAsResource(fileId);
        ContentDisposition disposition = ContentDisposition.attachment()
            .filename(file.getOriginalName(), StandardCharsets.UTF_8)
            .build();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .contentType(MediaType.parseMediaType(file.getMimeType()))
            .contentLength(file.getSizeBytes())
            .body(resource);
    }
}
