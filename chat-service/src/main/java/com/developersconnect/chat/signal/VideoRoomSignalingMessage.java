package com.developersconnect.chat.signal;

/**
 * WebRTC signaling envelope for multi-party video rooms.
 *
 * type: JOIN_ROOM | USER_JOINED | WEBRTC_OFFER | WEBRTC_ANSWER | ICE_CANDIDATE | USER_LEFT
 */
public record VideoRoomSignalingMessage(
    String type,
    String roomId,
    String from,
    String to,
    String fromName,
    String sdp,
    String candidate,
    String sdpMid,
    Integer sdpMLineIndex
) {}
