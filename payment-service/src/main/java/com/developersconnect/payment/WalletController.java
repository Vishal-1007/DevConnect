package com.developersconnect.payment;

import com.developersconnect.payment.dto.AddWalletMoneyRequest;
import com.developersconnect.payment.dto.WalletResponse;
import com.developersconnect.payment.dto.WalletTransactionResponse;
import com.developersconnect.payment.security.AuthPrincipal;
import com.developersconnect.payment.service.WalletService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(Authentication authentication) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(walletService.getWallet(userId));
    }

    @PostMapping("/add-money")
    public ResponseEntity<WalletResponse> addMoney(
        Authentication authentication,
        @Valid @RequestBody AddWalletMoneyRequest request
    ) {
        UUID userId = principalId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(walletService.addMoney(userId, request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<WalletTransactionResponse>> history(Authentication authentication) {
        UUID userId = principalId(authentication);
        return ResponseEntity.ok(walletService.history(userId));
    }

    private UUID principalId(Authentication authentication) {
        AuthPrincipal principal = (AuthPrincipal) authentication.getPrincipal();
        return principal.accountId();
    }
}
