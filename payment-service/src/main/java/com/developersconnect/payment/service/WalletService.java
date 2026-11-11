package com.developersconnect.payment.service;

import com.developersconnect.payment.dto.AddWalletMoneyRequest;
import com.developersconnect.payment.dto.WalletResponse;
import com.developersconnect.payment.dto.WalletTransactionResponse;
import com.developersconnect.payment.model.Wallet;
import com.developersconnect.payment.model.WalletTransaction;
import com.developersconnect.payment.repository.WalletRepository;
import com.developersconnect.payment.repository.WalletTransactionRepository;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public WalletResponse getWallet(UUID userId) {
        return toResponse(requireWallet(userId));
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> history(UUID userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toTransactionResponse)
            .toList();
    }

    @Transactional
    public WalletResponse addMoney(UUID userId, AddWalletMoneyRequest request) {
        Wallet wallet = requireWallet(userId);
        wallet.setBalanceCents(wallet.getBalanceCents() + request.amountCents());
        walletRepository.save(wallet);
        recordTransaction(userId, request.amountCents(), "TOP_UP", "Wallet recharge", null);
        return toResponse(wallet);
    }

    @Transactional
    public Wallet ensureWallet(UUID userId) {
        return walletRepository.findById(userId).orElseGet(() -> {
            Wallet wallet = new Wallet();
            wallet.setUserId(userId);
            wallet.setBalanceCents(0);
            wallet.setCurrency("INR");
            return walletRepository.save(wallet);
        });
    }

    @Transactional
    public void debit(UUID userId, long amountCents, String type, String description, UUID callId) {
        if (amountCents <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debit amount must be positive");
        }
        Wallet wallet = requireWallet(userId);
        if (wallet.getBalanceCents() < amountCents) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Insufficient wallet balance");
        }
        wallet.setBalanceCents(wallet.getBalanceCents() - amountCents);
        walletRepository.save(wallet);
        recordTransaction(userId, -amountCents, type, description, callId);
    }

    @Transactional(readOnly = true)
    public long balanceCents(UUID userId) {
        return requireWallet(userId).getBalanceCents();
    }

    private Wallet requireWallet(UUID userId) {
        return walletRepository.findById(userId).orElseGet(() -> ensureWallet(userId));
    }

    private void recordTransaction(UUID userId, long amountCents, String type, String description, UUID callId) {
        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(userId);
        tx.setAmountCents(amountCents);
        tx.setType(type);
        tx.setDescription(description);
        tx.setCallId(callId);
        transactionRepository.save(tx);
    }

    private WalletResponse toResponse(Wallet wallet) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        return new WalletResponse(
            wallet.getUserId(),
            wallet.getBalanceCents(),
            wallet.getCurrency(),
            formatter.format(wallet.getBalanceCents() / 100.0),
            wallet.getUpdatedAt()
        );
    }

    private WalletTransactionResponse toTransactionResponse(WalletTransaction tx) {
        return new WalletTransactionResponse(
            tx.getId(),
            tx.getAmountCents(),
            tx.getType(),
            tx.getDescription(),
            tx.getCallId(),
            tx.getCreatedAt()
        );
    }
}
