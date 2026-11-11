package com.developersconnect.mentor;

import java.util.UUID;

import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.PlatformVideoStreamService;
import com.developersconnect.mentor.service.StreamVideoStreamService;

@RestController
@RequestMapping("/api/videos")
public class StreamVideoController {

    private final StreamVideoStreamService streamService;
    private final PlatformVideoStreamService platformStreamService;

    public StreamVideoController(
        StreamVideoStreamService streamService,
        PlatformVideoStreamService platformStreamService
    ) {
        this.streamService = streamService;
        this.platformStreamService = platformStreamService;
    }

    @GetMapping("/stream/{lessonId}")
    public ResponseEntity<ResourceRegion> stream(
        @PathVariable UUID lessonId,
        @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
        Authentication auth
    ) {
        UUID userId = ((AuthPrincipal) auth.getPrincipal()).accountId();
        return streamService.streamLesson(userId, lessonId, rangeHeader);
    }

    @GetMapping("/platform/{videoId}")
    public ResponseEntity<ResourceRegion> streamPlatformVideo(
        @PathVariable UUID videoId,
        @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader
    ) {
        return platformStreamService.streamVideo(videoId, rangeHeader);
    }
}
