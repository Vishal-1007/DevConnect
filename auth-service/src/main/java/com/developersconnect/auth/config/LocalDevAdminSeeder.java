package com.developersconnect.auth.config;

import com.developersconnect.auth.model.UserAccount;
import com.developersconnect.auth.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a built-in admin account for local development.
 *
 *  Username : admin
 *  Password : Admin@123
 *  Email    : admin@devconnect.io
 *  Role     : ADMIN
 *
 * Log-in with these credentials in the browser to access the Admin Panel.
 */
@Component
@Profile("local")
public class LocalDevAdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevAdminSeeder.class);

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL    = "admin@devconnect.io";
    private static final String ADMIN_PASSWORD = "Admin@123";
    private static final String ADMIN_ROLE     = "ADMIN";

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalDevAdminSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userAccountRepository.existsByUsernameIgnoreCase(ADMIN_USERNAME)) {
            log.info("Admin account already exists — skipping seed");
            return;
        }

        UserAccount admin = new UserAccount();
        admin.setUsername(ADMIN_USERNAME);
        admin.setEmail(ADMIN_EMAIL);
        admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRoles(ADMIN_ROLE);
        admin.setEnabled(true);

        userAccountRepository.save(admin);
        log.info("=== Local dev admin account seeded  ===");
        log.info("  Username : {}", ADMIN_USERNAME);
        log.info("  Password : {}", ADMIN_PASSWORD);
        log.info("  Role     : {}", ADMIN_ROLE);
        log.info("=======================================");
    }
}
