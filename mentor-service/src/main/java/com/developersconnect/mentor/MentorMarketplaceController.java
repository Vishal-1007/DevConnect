package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MarketplaceMentorCardResponse;
import com.developersconnect.mentor.service.MentorMarketplaceService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/marketplace")
public class MentorMarketplaceController {

    private final MentorMarketplaceService marketplaceService;

    public MentorMarketplaceController(MentorMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/available")
    public ResponseEntity<List<MarketplaceMentorCardResponse>> available() {
        return ResponseEntity.ok(marketplaceService.listAvailableMentors());
    }

    @GetMapping("/{mentorId}")
    public ResponseEntity<MarketplaceMentorCardResponse> mentor(@PathVariable UUID mentorId) {
        return ResponseEntity.ok(marketplaceService.getMentor(mentorId));
    }
}
