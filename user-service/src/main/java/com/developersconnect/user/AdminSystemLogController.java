package com.developersconnect.user;

import com.developersconnect.user.dto.SystemLogAnalyticsResponse;
import com.developersconnect.user.dto.SystemLogResponse;
import com.developersconnect.user.service.SystemLogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/system-logs")
public class AdminSystemLogController {

    private final SystemLogService systemLogService;

    public AdminSystemLogController(SystemLogService systemLogService) {
        this.systemLogService = systemLogService;
    }

    @GetMapping
    public ResponseEntity<List<SystemLogResponse>> listLogs(
        @RequestParam(defaultValue = "all") String level,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String service,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "200") int limit
    ) {
        return ResponseEntity.ok(systemLogService.listLogs(level, category, service, q, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<SystemLogAnalyticsResponse> analytics() {
        return ResponseEntity.ok(systemLogService.getAnalytics());
    }
}
