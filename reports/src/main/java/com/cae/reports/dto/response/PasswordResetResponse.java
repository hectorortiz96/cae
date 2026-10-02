package com.cae.reports.dto.response;

public class PasswordResetResponse {
    private String message;
    private boolean success;

    public PasswordResetResponse() {
    }

    public PasswordResetResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}

