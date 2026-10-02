package com.cae.reports.dto.response;

import com.cae.reports.model.Report;

import java.util.Date;

public class ReportResponse {
    private Integer id;
    private String content;
    private String student;
    private String grade;
    private String reportType;
    private String authorUsername;
    private String authorFullName;
    private Date createdAt;
    private boolean received;

    public ReportResponse() {
    }

    public ReportResponse(Integer id, String content, String student, String grade, String reportType, String authorUsername, String authorFullName, Date createdAt, boolean received) {
        this.id = id;
        this.content = content;
        this.student = student;
        this.grade = grade;
        this.reportType = reportType;
        this.authorUsername = authorUsername;
        this.authorFullName = authorFullName;
        this.createdAt = createdAt;
        this.received = received;
    }

    // Factory method to convert Report entity to ReportResponse DTO
    public static ReportResponse fromReport(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getContent(),
                report.getStudent(),
                report.getGrade().getValue(),
                report.getReportType().getValue(),
                report.getUser().getUsername(),
                report.getUser().getFullName(),
                report.getCreatedAt(),
                report.isReceived()
        );
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public String getAuthorUsername() {
        return authorUsername;
    }

    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }

    public String getAuthorFullName() {
        return authorFullName;
    }

    public void setAuthorFullName(String authorFullName) {
        this.authorFullName = authorFullName;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isReceived() {
        return received;
    }

    public void setReceived(boolean received) {
        this.received = received;
    }
}
