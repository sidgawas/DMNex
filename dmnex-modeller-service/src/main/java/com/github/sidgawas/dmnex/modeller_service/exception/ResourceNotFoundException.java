package com.github.sidgawas.dmnex.modeller_service.exception;

/**
 * Exception thrown when a requested resource is not found.
 * Results in a 404 NOT_FOUND HTTP response when thrown from a controller.
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
