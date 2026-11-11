package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.LearningCourse;
import com.developersconnect.mentor.model.LearningLesson;
import com.developersconnect.mentor.repository.CoursePurchaseRepository;
import com.developersconnect.mentor.repository.LearningCourseRepository;
import com.developersconnect.mentor.repository.LearningLessonRepository;
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
public class StreamVideoStreamService {

    private static final String COMPLETED = "COMPLETED";

    private final LearningLessonRepository lessonRepository;
    private final LearningCourseRepository courseRepository;
    private final CoursePurchaseRepository purchaseRepository;
    private final StreamMediaStorageService mediaStorageService;

    public StreamVideoStreamService(
        LearningLessonRepository lessonRepository,
        LearningCourseRepository courseRepository,
        CoursePurchaseRepository purchaseRepository,
        StreamMediaStorageService mediaStorageService
    ) {
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.purchaseRepository = purchaseRepository;
        this.mediaStorageService = mediaStorageService;
    }

    public ResponseEntity<ResourceRegion> streamLesson(UUID learnerId, UUID lessonId, String rangeHeader) {
        LearningLesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
        LearningCourse course = courseRepository.findById(lesson.getCourseId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        assertStreamAccess(learnerId, lesson, course);

        if (!mediaStorageService.isLocalMedia(lesson.getVideoUrl())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Streamable upload not found for lesson");
        }

        FileSystemResource resource = new FileSystemResource(
            mediaStorageService.resolveStoredPath(lesson.getVideoUrl())
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

    private void assertStreamAccess(UUID learnerId, LearningLesson lesson, LearningCourse course) {
        if (course.getMentorId().equals(learnerId)) {
            return;
        }
        if ("FREE".equals(course.getPricingType())) {
            return;
        }
        if (lesson.isPreviewFree()) {
            return;
        }
        if (purchaseRepository.existsByCourseIdAndLearnerIdAndStatus(course.getId(), learnerId, COMPLETED)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Purchase required");
    }
}
