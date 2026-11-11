package com.developersconnect.mentor;

import com.developersconnect.mentor.service.StreamMediaStorageService;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/learning/media")
public class LearningMediaController {

    private static final String PREFIX = "/api/mentors/learning/media/";

    private final StreamMediaStorageService mediaStorage;

    public LearningMediaController(StreamMediaStorageService mediaStorage) {
        this.mediaStorage = mediaStorage;
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (!uri.startsWith(PREFIX)) {
            return ResponseEntity.notFound().build();
        }
        String relativePath = uri.substring(PREFIX.length());
        Path path = mediaStorage.resolveStoredPath(relativePath);
        FileSystemResource file = new FileSystemResource(path);
        MediaType mediaType = MediaTypeFactory.getMediaType(path.getFileName().toString())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok().contentType(mediaType).body(file);
    }
}
