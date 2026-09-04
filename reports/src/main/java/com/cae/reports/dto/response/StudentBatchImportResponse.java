package com.cae.reports.dto.response;

import java.util.List;

public class StudentBatchImportResponse {
    private int totalRows;
    private int createdRows;
    private int failedRows;
    private List<RowError> errors;

    public StudentBatchImportResponse() {
    }

    public StudentBatchImportResponse(int totalRows, int createdRows, int failedRows, List<RowError> errors) {
        this.totalRows = totalRows;
        this.createdRows = createdRows;
        this.failedRows = failedRows;
        this.errors = errors;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getCreatedRows() {
        return createdRows;
    }

    public void setCreatedRows(int createdRows) {
        this.createdRows = createdRows;
    }

    public int getFailedRows() {
        return failedRows;
    }

    public void setFailedRows(int failedRows) {
        this.failedRows = failedRows;
    }

    public List<RowError> getErrors() {
        return errors;
    }

    public void setErrors(List<RowError> errors) {
        this.errors = errors;
    }

    public static class RowError {
        private int row;
        private String message;

        public RowError() {
        }

        public RowError(int row, String message) {
            this.row = row;
            this.message = message;
        }

        public int getRow() {
            return row;
        }

        public void setRow(int row) {
            this.row = row;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}

