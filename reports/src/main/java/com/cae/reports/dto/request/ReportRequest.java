package com.cae.reports.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReportRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String content;

    @NotBlank(message = "Student name is required")
    @Size(max = 150, message = "Student name must not exceed 150 characters")
    private String studentName;

    @NotNull(message = "Grade is required")
    private String grade;

    @NotNull(message = "Report type is required")
    private String reportType;

    public ReportRequest() {
    }

    public ReportRequest(String title, String content, String studentName, String grade, String reportType) {
        this.title = title;
        this.content = content;
        this.studentName = studentName;
        this.grade = grade;
        this.reportType = reportType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
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

