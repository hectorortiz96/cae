package com.cae.reports.service;

import com.cae.reports.dto.response.ReportResponse;
import com.cae.reports.dto.request.ReportRequest;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.Role;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ReportService.class);

    private final ReportRepository reportRepository;
    private final EmailNotificationService emailNotificationService;

    public ReportService(ReportRepository reportRepository, EmailNotificationService emailNotificationService) {
        this.reportRepository = reportRepository;
        this.emailNotificationService = emailNotificationService;
    }

    public Report createReport(ReportRequest request, User user) {
        Report report = new Report();
        report.setContent(request.getContent());
        report.setStudent(request.getStudent());
        report.setGrade(Grade.fromValue(request.getGrade()));
        report.setReportType(ReportType.fromValue(request.getReportType()));
        report.setUser(user);

        Report savedReport = reportRepository.save(report);

        try {
            byte[] pdfAttachment = decodePdfAttachment(request.getPdfBase64(), savedReport.getId());
            emailNotificationService.notifyReportCreated(
                    savedReport,
                    pdfAttachment,
                    request.getPdfFileName(),
                    request.getPdfMimeType()
            );
        } catch (RuntimeException ex) {
            // Report creation should not fail if notification delivery fails.
            LOGGER.warn("Report {} saved, but email notification failed", savedReport.getId(), ex);
        }

        return savedReport;
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public Optional<Report> getReportById(Integer id) {
        return reportRepository.findById(id);
    }

    public void resendReportEmail(
            Integer id,
            User user,
            String pdfBase64,
            String pdfFileName,
            String pdfMimeType
    ) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));

        if (!report.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You are not authorized to resend this report email");
        }

        emailNotificationService.resendReportEmail(
                report,
                decodePdfAttachment(pdfBase64, report.getId()),
                pdfFileName,
                pdfMimeType
        );
    }

    public List<Report> getReportsByUser(User user) {
        return reportRepository.findByUserOrderByCreatedAtAscIdAsc(user);
    }

    public List<Report> getReportsByGrade(String grade) {
        return reportRepository.findByGradeOrderByCreatedAtAscIdAsc(Grade.fromValue(grade));
    }

    public List<Report> getReportsByReportType(String reportType) {
        return reportRepository.findByReportTypeOrderByCreatedAtAscIdAsc(ReportType.fromValue(reportType));
    }

    public List<Report> getReportsByStudent(String student) {
        return reportRepository.findByStudentContainingIgnoreCaseOrderByCreatedAtAscIdAsc(student.trim());
    }

    public List<Report> searchReportsByStudent(String studentName) {
        return reportRepository.findByStudentContainingIgnoreCaseOrderByCreatedAtAscIdAsc(studentName.trim());
    }

    public Report updateReport(Integer id, ReportRequest request, User user) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        // Check if the user owns this report
        if (!report.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this report");
        }

        report.setContent(request.getContent());
        report.setStudent(request.getStudent());
        report.setGrade(Grade.fromValue(request.getGrade()));
        report.setReportType(ReportType.fromValue(request.getReportType()));

        return reportRepository.save(report);
    }

    @Transactional
    public ReportResponse markReportReceived(Integer id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (!report.isReceived()) {
            report.setReceived(true);
            report.setReportReceivedDate(new Date());
            report = reportRepository.save(report);
        }

        return ReportResponse.fromReport(report);
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

    private byte[] decodePdfAttachment(String pdfBase64, Integer reportId) {
        String normalized = pdfBase64 == null ? "" : pdfBase64.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        try {
            return Base64.getDecoder().decode(normalized);
        } catch (IllegalArgumentException ex) {
            LOGGER.warn("Skipping PDF attachment for report {} because the provided Base64 payload is invalid", reportId, ex);
            return null;
        }
    }
}
