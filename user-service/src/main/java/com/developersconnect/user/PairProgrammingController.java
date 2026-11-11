package com.developersconnect.user;

import com.developersconnect.user.dto.PairProgrammingDtos.JoinPairSessionRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.PairChatMessageResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.PairSessionResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.RunPairCodeResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.SavePairCodeRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SavePairNoteRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SaveWhiteboardRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SendPairChatRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.SessionSummaryResponse;
import com.developersconnect.user.dto.PairProgrammingDtos.StartPairSessionRequest;
import com.developersconnect.user.dto.PairProgrammingDtos.StopRecordingRequest;
import com.developersconnect.user.model.PairSessionRecording;
import com.developersconnect.user.security.AuthPrincipal;
import com.developersconnect.user.service.PairProgrammingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pair")
public class PairProgrammingController {

    private final PairProgrammingService pairProgrammingService;

    public PairProgrammingController(PairProgrammingService pairProgrammingService) {
        this.pairProgrammingService = pairProgrammingService;
    }

    @PostMapping("/start")
    public ResponseEntity<PairSessionResponse> start(
        Authentication authentication,
        @Valid @RequestBody StartPairSessionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            pairProgrammingService.startSession(principal.accountId(), principal.username(), request)
        );
    }

    @PostMapping("/join")
    public ResponseEntity<PairSessionResponse> join(
        Authentication authentication,
        @Valid @RequestBody JoinPairSessionRequest request
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(
            pairProgrammingService.joinSession(principal.accountId(), principal.username(), request)
        );
    }

    @PostMapping("/end")
    public ResponseEntity<SessionSummaryResponse> end(
        Authentication authentication,
        @RequestBody(required = false) EndSessionBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        UUID sessionId = body != null ? body.sessionId() : null;
        if (sessionId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.BAD_REQUEST, "sessionId is required"
            );
        }
        return ResponseEntity.ok(pairProgrammingService.endSession(sessionId, principal.accountId()));
    }

    @GetMapping("/session/{id}")
    public ResponseEntity<PairSessionResponse> getSession(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.getSession(id, principal.accountId()));
    }

    @PostMapping("/run-code")
    public ResponseEntity<RunPairCodeResponse> runCode(
        Authentication authentication,
        @RequestBody RunCodeBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.runCode(
            body.sessionId(),
            principal.accountId(),
            new RunPairCodeRequest(body.code(), body.language(), body.problemId())
        ));
    }

    @PostMapping("/code/save")
    public ResponseEntity<PairSessionResponse> saveCode(
        Authentication authentication,
        @RequestBody SaveCodeBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.saveCode(
            body.sessionId(),
            principal.accountId(),
            new SavePairCodeRequest(body.code(), body.language())
        ));
    }

    @PostMapping("/chat/send")
    public ResponseEntity<PairChatMessageResponse> sendChat(
        Authentication authentication,
        @RequestBody ChatBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(pairProgrammingService.sendChat(
            body.sessionId(),
            principal.accountId(),
            principal.username(),
            new SendPairChatRequest(body.message(), body.messageType())
        ));
    }

    @GetMapping("/chat/{sessionId}")
    public ResponseEntity<List<PairChatMessageResponse>> listChat(
        Authentication authentication,
        @PathVariable UUID sessionId
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.listChat(sessionId, principal.accountId()));
    }

    @PostMapping("/note/save")
    public ResponseEntity<PairSessionResponse> saveNote(
        Authentication authentication,
        @RequestBody NoteBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.saveNote(
            body.sessionId(),
            principal.accountId(),
            new SavePairNoteRequest(body.content())
        ));
    }

    @PostMapping("/whiteboard/save")
    public ResponseEntity<PairSessionResponse> saveWhiteboard(
        Authentication authentication,
        @RequestBody WhiteboardBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.saveWhiteboard(
            body.sessionId(),
            principal.accountId(),
            new SaveWhiteboardRequest(body.jsonData())
        ));
    }

    @PostMapping("/record/start")
    public ResponseEntity<PairSessionRecording> startRecording(
        Authentication authentication,
        @RequestBody SessionIdBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(
            pairProgrammingService.startRecording(body.sessionId(), principal.accountId())
        );
    }

    @PostMapping("/record/stop")
    public ResponseEntity<PairSessionRecording> stopRecording(
        Authentication authentication,
        @RequestBody StopRecordBody body
    ) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(pairProgrammingService.stopRecording(
            body.sessionId(),
            principal.accountId(),
            new StopRecordingRequest(body.videoUrl())
        ));
    }

    public record EndSessionBody(UUID sessionId) {}
    public record RunCodeBody(UUID sessionId, String code, String language, String problemId) {}
    public record SaveCodeBody(UUID sessionId, String code, String language) {}
    public record ChatBody(UUID sessionId, String message, String messageType) {}
    public record NoteBody(UUID sessionId, String content) {}
    public record WhiteboardBody(UUID sessionId, String jsonData) {}
    public record SessionIdBody(UUID sessionId) {}
    public record StopRecordBody(UUID sessionId, String videoUrl) {}
}
