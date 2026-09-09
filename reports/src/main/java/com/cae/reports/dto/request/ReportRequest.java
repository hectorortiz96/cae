package com.cae.reports.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReportRequest {
    private String content;

    @NotBlank(message = "Student name is required")
    @Size(max = 150, message = "Student name must not exceed 150 characters")
    private String student;

    @NotNull(message = "Grade is required")
    private String grade;

    @NotNull(message = "Report type is required")
    private String reportType;

    private String pdfBase64;
    private String pdfFileName;
    private String pdfMimeType;

    public ReportRequest() {
    }

    public ReportRequest(String content, String student, String grade, String reportType) {
        this.content = content;
        this.student = student;
        this.grade = grade;
        this.reportType = reportType;
    }

    public ReportRequest(
            String content,
            String student,
            String grade,
            String reportType,
            String pdfBase64,
            String pdfFileName,
            String pdfMimeType
    ) {
        this.content = content;
        this.student = student;
        this.grade = grade;
        this.reportType = reportType;
        this.pdfBase64 = pdfBase64;
        this.pdfFileName = pdfFileName;
        this.pdfMimeType = pdfMimeType;
    }


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStudent() {
        return student;
    }

    public void setStudent(String student) {
        this.student = student;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getPdfBase64() {
        return pdfBase64;
    }

    public void setPdfBase64(String pdfBase64) {
        this.pdfBase64 = pdfBase64;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public String getPdfMimeType() {
        return pdfMimeType;
    }

    public void setPdfMimeType(String pdfMimeType) {
        this.pdfMimeType = pdfMimeType;
    }
}

