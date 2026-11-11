package com.developersconnect.mentor;

import com.developersconnect.mentor.dto.MentorPricingResponse;
import com.developersconnect.mentor.dto.UpsertMentorPricingRequest;
import com.developersconnect.mentor.security.AuthPrincipal;
import com.developersconnect.mentor.service.MentorMarketplaceService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentors/me/pricing")
public class MentorPricingController {

    private final MentorMarketplaceService marketplaceService;

    public MentorPricingController(MentorMarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping
    public ResponseEntity<MentorPricingResponse> getPricing(Authentication authentication) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(marketplaceService.getMyPricing(mentorId));
    }

    @PostMapping
    public ResponseEntity<MentorPricingResponse> createPricing(
        Authentication authentication,
        @Valid @RequestBody UpsertMentorPricingRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(marketplaceService.upsertPricing(mentorId, request));
    }

    @PutMapping
    public ResponseEntity<MentorPricingResponse> updatePricing(
        Authentication authentication,
        @Valid @RequestBody UpsertMentorPricingRequest request
    ) {
        UUID mentorId = principalId(authentication);
        return ResponseEntity.ok(marketplaceService.upsertPricing(mentorId, request));
    }

    private UUID principalId(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return principal.accountId();
    }
}
