package com.developersconnect.mentor;

import com.developersconnect.mentor.security.AuthSupport;
import com.developersconnect.mentor.service.MockInterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mock-interviewers")
public class MockInterviewersAliasController {

    private final MockInterviewService mockInterviewService;

    public MockInterviewersAliasController(MockInterviewService mockInterviewService) {
        this.mockInterviewService = mockInterviewService;
    }

    @GetMapping
    public ResponseEntity<?> listInterviewers(
        Authentication auth,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "false") boolean onlineOnly,
        @RequestParam(required = false) Double minRating,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice
    ) {
        return ResponseEntity.ok(mockInterviewService.listInterviewers(
            AuthSupport.optionalUserId(auth), search, category, onlineOnly, minRating, minPrice, maxPrice
        ));
    }
}
