package com.cae.reports.service;

import com.cae.reports.dto.request.ReportRequest;
import com.cae.reports.dto.response.ReportResponse;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.Role;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReportServiceTests {

    @Test
    void createReportSavesReportAndTriggersEmailNotification() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        ReportRequest request = new ReportRequest("Body", "Jane Doe", "2A", "Reporte");
        String pdfBytes = "fake-pdf-content";
        request.setPdfBase64(Base64.getEncoder().encodeToString(pdfBytes.getBytes(StandardCharsets.UTF_8)));
        request.setPdfFileName("report-100.pdf");
        request.setPdfMimeType("application/pdf");
        User user = new User();
        user.setId(11);
        user.setUsername("teacher1");

        Report savedReport = new Report();
        savedReport.setId(100);
        savedReport.setStudent("Jane Doe");
        savedReport.setGrade(Grade.GRADE_2A);
        savedReport.setReportType(ReportType.REPORT);
        savedReport.setUser(user);

        when(reportRepository.save(any(Report.class))).thenReturn(savedReport);

        Report result = reportService.createReport(request, user);

        assertEquals(100, result.getId());
        verify(reportRepository).save(any(Report.class));
        verify(emailNotificationService).notifyReportCreated(
                eq(savedReport),
                eq(pdfBytes.getBytes(StandardCharsets.UTF_8)),
                eq("report-100.pdf"),
                eq("application/pdf")
        );
    }

    @Test
    void createReportStillReturnsSavedReportWhenNotificationFails() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        ReportRequest request = new ReportRequest("Body", "Jane Doe", "2A", "Reporte");
        User user = new User();
        user.setId(11);

        Report savedReport = new Report();
        savedReport.setId(101);
        savedReport.setStudent("Jane Doe");
        savedReport.setGrade(Grade.GRADE_2A);
        savedReport.setReportType(ReportType.REPORT);
        savedReport.setUser(user);

        when(reportRepository.save(any(Report.class))).thenReturn(savedReport);
        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailNotificationService)
                .notifyReportCreated(savedReport, null, null, null);

        Report result = reportService.createReport(request, user);

        assertEquals(101, result.getId());
        verify(reportRepository).save(any(Report.class));
        verify(emailNotificationService).notifyReportCreated(savedReport, null, null, null);
    }

    @Test
    void resendReportEmailRequiresOwnershipAndDelegatesToEmailService() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        User user = new User();
        user.setId(11);
        Report report = new Report();
        report.setId(42);
        report.setUser(user);
        when(reportRepository.findById(42)).thenReturn(Optional.of(report));

        reportService.resendReportEmail(42, user, "cGRm", "report.pdf", "application/pdf");

        verify(emailNotificationService).resendReportEmail(
                report,
                "pdf".getBytes(StandardCharsets.UTF_8),
                "report.pdf",
                "application/pdf"
        );
    }

    @Test
    void resendReportEmailRejectsReportsOwnedByAnotherUser() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        User owner = new User();
        owner.setId(11);
        User otherUser = new User();
        otherUser.setId(12);
        Report report = new Report();
        report.setId(42);
        report.setUser(owner);
        when(reportRepository.findById(42)).thenReturn(Optional.of(report));

        assertThrows(
                AccessDeniedException.class,
                () -> reportService.resendReportEmail(42, otherUser, null, null, null)
        );
        verify(emailNotificationService, never()).resendReportEmail(
                any(Report.class),
                any(),
                any(),
                any()
        );
    }

    @Test
    void resendReportEmailAllowsAdminsToResendReportsTheyDoNotOwn() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        User owner = new User();
        owner.setId(11);
        User admin = new User();
        admin.setId(12);
        admin.setRole(Role.ADMIN);
        Report report = new Report();
        report.setId(42);
        report.setUser(owner);
        when(reportRepository.findById(42)).thenReturn(Optional.of(report));

        reportService.resendReportEmail(42, admin, null, null, null);

        verify(emailNotificationService).resendReportEmail(report, null, null, null);
    }

    @Test
    void markReportReceivedSetsFlagAndReturnsResponse() {
        ReportRepository reportRepository = mock(ReportRepository.class);
        EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
        ReportService reportService = new ReportService(reportRepository, emailNotificationService);

        User user = new User();
        user.setId(1);
        user.setUsername("teacher1");

        Report existingReport = new Report();
        existingReport.setId(5);
        existingReport.setStudent("Jane Doe");
        existingReport.setGrade(Grade.GRADE_2A);
        existingReport.setReportType(ReportType.REPORT);
        existingReport.setUser(user);
        existingReport.setReceived(false);

        when(reportRepository.findById(5)).thenReturn(Optional.of(existingReport));
        when(reportRepository.save(existingReport)).thenReturn(existingReport);

        ReportResponse response = reportService.markReportReceived(5);

        assertEquals(5, response.getId());
        assertEquals("teacher1", response.getAuthorUsername());
        assertTrue(response.isReceived());
        assertNotNull(response.getReportReceivedDate());
        assertEquals(existingReport.getReportReceivedDate(), response.getReportReceivedDate());
        verify(reportRepository).save(existingReport);
    }
}
