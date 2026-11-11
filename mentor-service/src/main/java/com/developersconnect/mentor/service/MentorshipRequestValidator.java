package com.developersconnect.mentor.service;

import com.developersconnect.mentor.model.MentorStudentRecord;
import com.developersconnect.mentor.model.MentorshipRequest;
import com.developersconnect.mentor.repository.MentorStudentRecordRepository;
import com.developersconnect.mentor.repository.MentorshipRequestRepository;
import java.util.EnumSet;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class MentorshipRequestValidator {

    private final MentorshipRequestRepository requestRepository;
    private final MentorStudentRecordRepository studentRecordRepository;

    public MentorshipRequestValidator(
        MentorshipRequestRepository requestRepository,
        MentorStudentRecordRepository studentRecordRepository
    ) {
        this.requestRepository = requestRepository;
        this.studentRecordRepository = studentRecordRepository;
    }

    public void ensureCanCreate(UUID mentorId, UUID learnerId) {
        if (studentRecordRepository.findByMentorIdAndLearnerId(mentorId, learnerId)
            .filter(record -> MentorStudentRecord.STATUS_ACTIVE.equalsIgnoreCase(record.getStatus()))
            .isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                MentorshipRequestService.ACTIVE_MENTORSHIP_MESSAGE
            );
        }

        if (requestRepository.existsByMentorIdAndLearnerIdAndStatusIn(
            mentorId,
            learnerId,
            EnumSet.of(MentorshipRequest.Status.PENDING, MentorshipRequest.Status.ACCEPTED)
        )) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                MentorshipRequestService.ACTIVE_MENTORSHIP_MESSAGE
            );
        }
    }
}
