package com.developersconnect.mentor.config;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai-review")
public class AiReviewProperties {

    /** Daily free AI code reviews per user */
    private int freeDailyLimit = 2;

    /** Price per additional review (INR) */
    private BigDecimal paidReviewPriceInr = new BigDecimal("50");

    /** IANA timezone for daily reset at midnight */
    private String usageZone = "Asia/Kolkata";

    private Gemini gemini = new Gemini();

    public int getFreeDailyLimit() { return freeDailyLimit; }
    public void setFreeDailyLimit(int freeDailyLimit) { this.freeDailyLimit = freeDailyLimit; }
    public BigDecimal getPaidReviewPriceInr() { return paidReviewPriceInr; }
    public void setPaidReviewPriceInr(BigDecimal paidReviewPriceInr) { this.paidReviewPriceInr = paidReviewPriceInr; }
    public String getUsageZone() { return usageZone; }
    public void setUsageZone(String usageZone) { this.usageZone = usageZone; }
    public Gemini getGemini() { return gemini; }
    public void setGemini(Gemini gemini) { this.gemini = gemini; }

    public int getPaidReviewPriceCents() {
        return paidReviewPriceInr.movePointRight(2).intValue();
    }

    public static class Gemini {
        private String apiKey = "";
        private String model = "gemini-1.5-flash";
        private int timeoutSeconds = 90;

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
