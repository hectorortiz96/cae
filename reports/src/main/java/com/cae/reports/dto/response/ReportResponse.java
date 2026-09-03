package com.cae.reports.dto.response;

import com.cae.reports.model.Report;

import java.util.Date;

public class ReportResponse {
    private Integer id;
    private String content;
    private String studentName;
    private String grade;
    private String reportType;
    private String authorUsername;
    private Date createdAt;

    public ReportResponse() {
    }

    public ReportResponse(Integer id, String content, String studentName, String grade, String reportType, String authorUsername, Date createdAt) {
        this.id = id;
        this.content = content;
        this.studentName = studentName;
        this.grade = grade;
        this.reportType = reportType;
        this.authorUsername = authorUsername;
        this.createdAt = createdAt;
    }

    // Factory method to convert Report entity to ReportResponse DTO
    public static ReportResponse fromReport(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getContent(),
                report.getStudentName(),
                report.getGrade().getValue(),
                report.getReportType().getValue(),
                report.getUser().getUsername(),
                report.getCreatedAt()
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

    public String getAuthorUsername() {
        return authorUsername;
    }

    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}

