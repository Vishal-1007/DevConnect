package com.developersconnect.user.service;

import com.developersconnect.user.model.CommunityPost;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

@Component
public class ContentModerationScanner {

    public record ModerationScanResult(
        boolean flagged,
        Set<String> flags,
        String note
    ) {}

    public ModerationScanResult scan(String content) {
        if (content == null || content.isBlank()) {
            return new ModerationScanResult(false, Set.of(), null);
        }

        String hay = content.toLowerCase(Locale.ROOT);
        Set<String> flags = new LinkedHashSet<>();

        if (containsAny(hay,
            "offensive", "rant", "stupid", "idiot", "moron", "worthless", "shut up",
            "kill yourself", "abusive", "harass", "bully", "loser", "trash"
        )) {
            flags.add("abusive_language");
        }

        if (containsAny(hay,
            "hate", "racist", "nazi", "genocide", "inferior race", "ethnic cleansing",
            "white power", "supremacist", "deport them all"
        )) {
            flags.add("hate_speech");
        }

        if (containsAny(hay,
            "telegram", "subscribe", "click here", "free money", "dm me", "follow my channel",
            "join my channel", "promo code", "limited offer", "act now"
        )) {
            flags.add("spam");
        }

        if (containsAny(hay,
            "crypto", "bitcoin", "invest now", "guaranteed return", "double your money",
            "wire transfer", "send money", "get rich", "forex signal", "nft drop"
        )) {
            flags.add("scam");
        }

        if (containsAny(hay,
            "porn", "nude", "xxx", "explicit", "onlyfans", "nsfw", "adult content",
            "sex tape", "18+"
        )) {
            flags.add("nsfw");
        }

        if (flags.isEmpty()) {
            return new ModerationScanResult(false, Set.of(), null);
        }

        String note = "AI moderation flagged: " + String.join(", ", flags);
        return new ModerationScanResult(true, Set.copyOf(flags), note);
    }

    public void applyScanResult(CommunityPost post, ModerationScanResult result) {
        if (!result.flagged()) {
            return;
        }
        post.setFlagged(true);
        post.setAutoFlagged(true);
        post.setModerationFlags(new LinkedHashSet<>(result.flags()));
        post.setModerationNote(result.note());
        post.setModerationStatus("flagged");
        post.setFlaggedAt(Instant.now());
    }

    private boolean containsAny(String hay, String... needles) {
        for (String needle : needles) {
            if (hay.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
