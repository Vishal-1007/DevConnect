package com.developersconnect.payment.model;

import java.util.Arrays;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public enum PaymentMode {
    CARD("Debit / Credit Card", "cards"),
    UPI("UPI", "upi"),
    GPAY("Google Pay", "wallets"),
    BHIM("BHIM UPI", "upi"),
    PAYTM("Paytm", "wallets"),
    PHONEPE("PhonePe", "wallets");

    private final String displayName;
    private final String category;

    PaymentMode(String displayName, String category) {
        this.displayName = displayName;
        this.category = category;
    }

    public String displayName() {
        return displayName;
    }

    public String category() {
        return category;
    }

    public static PaymentMode resolve(String paymentMode, String legacyPaymentMethod) {
        String candidate = paymentMode != null && !paymentMode.isBlank()
            ? paymentMode
            : legacyPaymentMethod;
        if (candidate == null || candidate.isBlank()) {
            return CARD;
        }
        return Arrays.stream(values())
            .filter(mode -> mode.name().equalsIgnoreCase(candidate.trim()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unsupported payment mode: " + candidate
            ));
    }

    public boolean requiresCardCollection() {
        return this == CARD;
    }

    public boolean isWalletOrUpi() {
        return this != CARD;
    }
}
