package com.cae.reports.service;

import com.cae.reports.dto.request.ReportRequest;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public Report createReport(ReportRequest request, User user) {
        Report report = new Report();
        report.setContent(request.getContent());
        report.setStudentName(request.getStudentName());
        report.setGrade(Grade.fromValue(request.getGrade()));
        report.setReportType(ReportType.fromValue(request.getReportType()));
        report.setUser(user);

        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public Optional<Report> getReportById(Integer id) {
        return reportRepository.findById(id);
    }

    public List<Report> getReportsByUser(User user) {
        return reportRepository.findByUser(user);
    }

    public List<Report> getReportsByGrade(String grade) {
        return reportRepository.findByGrade(Grade.fromValue(grade));
    }

    public List<Report> getReportsByReportType(String reportType) {
        return reportRepository.findByReportType(ReportType.fromValue(reportType));
    }

    public List<Report> getReportsByStudentName(String studentName) {
        return reportRepository.findByStudentName(studentName);
    }

    public Report updateReport(Integer id, ReportRequest request, User user) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        // Check if the user owns this report
        if (!report.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this report");
        }

        report.setContent(request.getContent());
        report.setStudentName(request.getStudentName());
        report.setGrade(Grade.fromValue(request.getGrade()));
        report.setReportType(ReportType.fromValue(request.getReportType()));

        return reportRepository.save(report);
    }

    public void deleteReport(Integer id, User user) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        // Check if the user owns this report
        if (!report.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this report");
        }

        reportRepository.delete(report);
    }
}

