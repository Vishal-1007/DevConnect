package com.developersconnect.mentor.dto;

import java.util.List;

public record StreamPageResponse<T>(
    List<T> items,
    int page,
    int size,
    long totalElements,
    boolean hasNext
) {
    public StreamPageResponse {
        if (items == null) items = List.of();
    }
}
