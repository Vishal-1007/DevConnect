package com.developersconnect.chat.signal;

/**
 * Real-time pair programming events over STOMP.
 */
public record PairCollaborationMessage(
    String sessionId,
    String type,
    String fromUserId,
    String fromName,
    String code,
    String language,
    Integer line,
    Integer column,
    String message,
    String messageType,
    String noteContent,
    String whiteboardJson,
    Boolean micEnabled,
    Boolean cameraEnabled,
    Boolean typing,
    String color
) {}
