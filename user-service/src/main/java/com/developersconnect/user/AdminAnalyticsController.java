package com.developersconnect.user;

import com.developersconnect.user.dto.BusinessAnalyticsResponse;
import com.developersconnect.user.service.AdminAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminAnalyticsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/business")
    public ResponseEntity<BusinessAnalyticsResponse> businessAnalytics() {
        return ResponseEntity.ok(adminAnalyticsService.getBusinessAnalytics());
    }
}
