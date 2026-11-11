package com.developersconnect.payment.config;

import com.developersconnect.payment.model.Wallet;
import com.developersconnect.payment.repository.WalletRepository;
import com.developersconnect.payment.service.WalletService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@Order(20)
public class LocalDevWalletSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalDevWalletSeeder.class);

    /** Demo learner account used in local auth flows. */
    private static final UUID DEMO_LEARNER_ID = UUID.fromString("22222222-2222-2222-2222-222222222201");

    private final WalletService walletService;
    private final WalletRepository walletRepository;

    public LocalDevWalletSeeder(WalletService walletService, WalletRepository walletRepository) {
        this.walletService = walletService;
        this.walletRepository = walletRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        Wallet wallet = walletService.ensureWallet(DEMO_LEARNER_ID);
        if (wallet.getBalanceCents() < 75_000) {
            wallet.setBalanceCents(75_000);
            walletRepository.save(wallet);
            log.info("Seeded demo learner wallet with ₹750");
        }
    }
}
