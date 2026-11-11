package com.developersconnect.chat.signal;

/**
 * Generic WebRTC signaling envelope.
 * type: call-request | call-accept | call-reject | offer | answer | ice
 *       | match-request | match-assigned | match-accepted | match-rejected
 *       | match-expired | match-cancelled | match-ended
 */
public record SignalingMessage(
        String type,
        String from,
        String to,
        String fromName,
        String sdp,
        String candidate,
        String sdpMid,
        Integer sdpMLineIndex,
        String assignmentId,
        String criteria,
        String partnerRole,
        String status
) {}
