package com.developersconnect.chat.error;

import java.time.Instant;
import java.util.stream.Collectors;

import javax.naming.AuthenticationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {

        HttpStatus status =
                HttpStatus.valueOf(ex.getStatusCode().value());

        String message = ex.getReason() != null
                ? ex.getReason()
                : "Request failed";

        return buildError(status, message, request.getRequestURI());
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

        log.error("Unhandled error on {}", request.getRequestURI(), ex);

        return buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected error",
                request.getRequestURI()
        );
    }

    private ResponseEntity<ApiError> buildError(
            HttpStatus status,
            String message,
            String path
    ) {

        ApiError error = new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path
        );

        return ResponseEntity.status(status).body(error);
    }
}