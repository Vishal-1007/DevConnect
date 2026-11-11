package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MarketplaceMentorCardResponse;
import com.developersconnect.mentor.dto.MarketplaceStatsResponse;
import com.developersconnect.mentor.service.MentorMarketplaceService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final MentorMarketplaceService marketplaceService;

    public MarketplaceController(MentorMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<MarketplaceMentorCardResponse>> listMentors() {
        return ResponseEntity.ok(marketplaceService.listAvailableMentors());
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<MarketplaceMentorCardResponse> getMentor(@PathVariable UUID mentorId) {
        return ResponseEntity.ok(marketplaceService.getMentor(mentorId));
    }

    @GetMapping("/stats")
    public ResponseEntity<MarketplaceStatsResponse> stats() {
        return ResponseEntity.ok(marketplaceService.getMarketplaceStats());
    }
}
