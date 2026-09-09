package com.cae.reports.service;

import com.cae.reports.dto.request.ReportRequest;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
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
}

