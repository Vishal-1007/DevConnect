package com.developersconnect.user;

import static org.assertj.core.api.Assertions.assertThat;

import com.developersconnect.user.dto.UserProfileUpdateRequest;
import com.developersconnect.user.repository.UserProfileRepository;
import com.developersconnect.user.repository.UserRatingRepository;
import com.developersconnect.user.service.UserProfileService;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles({"local", "test"})
class UserProfileServiceTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRatingRepository userRatingRepository;

    @Test
    void upsertProfileStoresSkills() {
        UUID userId = UUID.randomUUID();
        var response = userProfileService.upsertProfile(
            userId,
            "dev1",
            new UserProfileUpdateRequest(
                "Dev One",
                "Bio",
                null,
                null,
                "MENTOR",
                "senior",
                "interviews",
                null,
                null,
                null,
                Set.of("Java", "Spring")
            )
        );

        assertThat(response.id()).isEqualTo(userId);
        assertThat(userProfileRepository.findById(userId)).isPresent();
        assertThat(userProfileRepository.findById(userId).orElseThrow().getSkills())
            .containsExactlyInAnyOrder("java", "spring");
    }
}
