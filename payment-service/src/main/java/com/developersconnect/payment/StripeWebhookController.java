package com.developersconnect.payment;

import com.developersconnect.payment.service.StripeWebhookService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/webhooks")
@ConditionalOnBean(StripeWebhookService.class)
public class StripeWebhookController {

    private final StripeWebhookService stripeWebhookService;

    public StripeWebhookController(StripeWebhookService stripeWebhookService) {
        this.stripeWebhookService = stripeWebhookService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
        @RequestBody String payload,
        @RequestHeader("Stripe-Signature") String signature
    ) {
        stripeWebhookService.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }
}
