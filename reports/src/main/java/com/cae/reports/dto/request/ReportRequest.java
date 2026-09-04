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

    public ReportRequest() {
    }

    public ReportRequest(String content, String student, String grade, String reportType) {
        this.content = content;
        this.student = student;
        this.grade = grade;
        this.reportType = reportType;
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
}

