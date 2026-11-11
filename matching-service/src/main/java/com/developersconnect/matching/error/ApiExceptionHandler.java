package com.developersconnect.matching.error;

import jakarta.servlet.http.HttpServletRequest;

import java.time.Instant;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {

        String message = ex.getReason() != null
                ? ex.getReason()
                : "Request failed";

        return buildError(
                ex.getStatusCode(),
                message,
                request.getRequestURI()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error ->
                        error.getField() + " " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        if (message.isBlank()) {
            message = "Validation failed";
        }

        return buildError(
                HttpStatus.BAD_REQUEST,
                message,
                request.getRequestURI()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(
            DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {

        log.warn("Database conflict: {}", ex.getMessage());

        return buildError(
                HttpStatus.CONFLICT,
                "Resource conflict",
                request.getRequestURI()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {

        return buildError(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                request.getRequestURI()
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(
            AuthenticationException ex,
            HttpServletRequest request
    ) {

        return buildError(
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                request.getRequestURI()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(
            Exception ex,
            HttpServletRequest request
    ) {

        log.error(
                "Unhandled exception on {}",
                request.getRequestURI(),
                ex
        );

        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected error",
                request.getRequestURI()
        );
    }

    private ResponseEntity<ApiError> buildError(
            HttpStatusCode status,
            String message,
            String path
    ) {

        HttpStatus resolved = HttpStatus.resolve(status.value());

        if (resolved == null) {
            resolved = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        ApiError error = new ApiError(
                Instant.now(),
                resolved.value(),
                resolved.getReasonPhrase(),
                message,
                path
        );

        return ResponseEntity
                .status(resolved)
                .body(error);
    }
}
