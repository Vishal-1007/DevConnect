package com.developersconnect.auth.config;

import com.developersconnect.auth.model.UserAccount;
import com.developersconnect.auth.repository.UserAccountRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo mentor auth accounts with fixed UUIDs aligned to user-service demo profiles
 * so admin report bans (toggle-enabled) resolve correctly in local dev.
 */
@Component
@Profile("local")
@Order(5)
public class LocalDevDemoAuthSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevDemoAuthSeeder.class);

    private static final String DEMO_PASSWORD = "Demo@123";

    private static final UUID RAHUL_ID = UUID.fromString("11111111-1111-1111-1111-111111111101");
    private static final UUID SARAH_ID = UUID.fromString("11111111-1111-1111-1111-111111111102");
    private static final UUID MIKE_ID = UUID.fromString("11111111-1111-1111-1111-111111111103");

    private static final UUID RECRUITER_ID = UUID.fromString("11111111-1111-1111-1111-111111111104");

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalDevDemoAuthSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed(RAHUL_ID, "rahul.demo", "rahul@demo.dev");
        seed(SARAH_ID, "sarah.demo", "sarah@demo.dev");
        seed(MIKE_ID, "mike.demo", "mike@demo.dev");
        seedRecruiter(RECRUITER_ID, "infosys.recruiter", "recruiter@infosys.com");
        log.info("Local demo auth accounts ready (password: {})", DEMO_PASSWORD);
    }

    private void seed(UUID id, String username, String email) {
        if (userAccountRepository.existsById(id)) {
            return;
        }
        if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
            return;
        }
        UserAccount account = new UserAccount();
        account.setId(id);
        account.setUsername(username);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
        account.setRoles("USER,MENTOR");
        account.setEnabled(true);
        userAccountRepository.save(account);
        log.info("Seeded demo auth account: {}", username);
    }

    private void seedRecruiter(UUID id, String username, String email) {
        userAccountRepository.findByUsernameIgnoreCase(username).ifPresentOrElse(existing -> {
            if (!"RECRUITER".equalsIgnoreCase(existing.getRoles()) && !existing.getRoles().toUpperCase().contains("RECRUITER")) {
                existing.setRoles("RECRUITER");
                userAccountRepository.save(existing);
                log.info("Updated demo recruiter account roles: {}", username);
            }
        }, () -> {
            if (userAccountRepository.existsById(id)) {
                return;
            }
            UserAccount account = new UserAccount();
            account.setId(id);
            account.setUsername(username);
            account.setEmail(email);
            account.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            account.setRoles("RECRUITER");
            account.setEnabled(true);
            userAccountRepository.save(account);
            log.info("Seeded demo recruiter account: {} (role: RECRUITER)", username);
        });
    }
}
