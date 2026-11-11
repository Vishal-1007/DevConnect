package com.developersconnect.payment.model;

public enum SagaState {
    STARTED,
    AUTHORIZED,
    COMPLETED,
    FAILED,
    COMPENSATING,
    COMPENSATED
}
