package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.LearningVideo;
import com.developersconnect.mentor.repository.LearningVideoRepository;
import java.io.IOException;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlatformVideoStreamService {

    private final LearningVideoRepository videoRepository;
    private final StreamMediaStorageService mediaStorage;

    public PlatformVideoStreamService(
        LearningVideoRepository videoRepository,
        StreamMediaStorageService mediaStorage
    ) {
        this.videoRepository = videoRepository;
        this.mediaStorage = mediaStorage;
    }

    public ResponseEntity<ResourceRegion> streamVideo(UUID videoId, String rangeHeader) {
        LearningVideo video = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        if (!"PUBLIC".equals(video.getVisibility()) && !"PREMIUM".equals(video.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Video not available");
        }
        if (!mediaStorage.isLocalMedia(video.getVideoUrl())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Streamable upload not found");
        }

        FileSystemResource resource = new FileSystemResource(
            mediaStorage.resolveStoredPath(video.getVideoUrl())
        );
        long contentLength;
        try {
            contentLength = resource.contentLength();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read video file");
        }

        ResourceRegion region = buildRegion(resource, rangeHeader, contentLength);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource.getFilename())
            .orElse(MediaType.APPLICATION_OCTET_STREAM);
        boolean partial = region.getCount() < contentLength;

        return ResponseEntity.status(partial ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK)
            .contentType(mediaType)
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .body(region);
    }

    private ResourceRegion buildRegion(Resource resource, String rangeHeader, long contentLength) {
        if (rangeHeader == null || rangeHeader.isBlank()) {
            return new ResourceRegion(resource, 0, contentLength);
        }
        HttpRange range = HttpRange.parseRanges(rangeHeader).stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE));
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        long rangeLength = end - start + 1;
        return new ResourceRegion(resource, start, rangeLength);
    }
}
