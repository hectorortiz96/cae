package com.cae.reports.service;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.Student;
import com.cae.reports.model.User;
import com.cae.reports.repository.StudentRepository;
import jakarta.mail.Address;
import jakarta.mail.BodyPart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailNotificationServiceTests {

    @Test
    void notifyReportCreatedSendsEmailToStudentContacts() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        EmailNotificationService emailNotificationService = new EmailNotificationService(
                mailSender,
                studentRepository,
                "noreply@test.local",
                true,
                "http://localhost:5173"
        );
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        Student student = new Student("Jane Doe", Grade.GRADE_2A, "family1@test.local", "family2@test.local");
        when(studentRepository.findByFullNameIgnoreCase("Jane Doe")).thenReturn(Optional.of(student));

        Report report = new Report();
        report.setId(42);
        report.setStudent("Jane Doe");
        report.setGrade(Grade.GRADE_2A);
        report.setReportType(ReportType.REPORT);
        report.setCreatedAt(Date.from(LocalDate.of(2026, 9, 9).atStartOfDay(ZoneId.systemDefault()).toInstant()));
        User author = new User();
        author.setUsername("teacher1");
        report.setUser(author);

        emailNotificationService.notifyReportCreated(
                report,
                "pdf-bytes".getBytes(StandardCharsets.UTF_8),
                "report-42.pdf",
                "application/pdf"
        );

        verify(mailSender).send(mimeMessage);

        assertEquals("noreply@test.local", mimeMessage.getFrom()[0].toString());
        assertArrayEquals(
                new String[]{"family1@test.local", "family2@test.local"},
                Arrays.stream(mimeMessage.getRecipients(MimeMessage.RecipientType.TO)).map(Address::toString).toArray(String[]::new)
        );
        assertEquals("New report for Jane Doe", mimeMessage.getSubject());

        MimeMultipart content = (MimeMultipart) mimeMessage.getContent();
        assertEquals(2, content.getCount());

        BodyPart attachmentPart = content.getBodyPart(1);
        assertEquals("REPORTE_Jane Doe_09-09-2026.pdf", attachmentPart.getFileName());
    }

    @Test
    void notifyReportCreatedSkipsWhenStudentDoesNotExist() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        EmailNotificationService emailNotificationService = new EmailNotificationService(
                mailSender,
                studentRepository,
                "noreply@test.local",
                true,
                "http://localhost:5173"
        );

        Report report = new Report();
        report.setId(7);
        report.setStudent("Missing Student");
        report.setGrade(Grade.GRADE_1A);
        report.setReportType(ReportType.OBSERVATION);
        report.setUser(new User());

        when(studentRepository.findByFullNameIgnoreCase("Missing Student")).thenReturn(Optional.empty());

        emailNotificationService.notifyReportCreated(report, null, null, null);

        verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(MimeMessage.class));
    }

    @Test
    void notifyReportCreatedSkipsWhenMailIsDisabled() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        EmailNotificationService emailNotificationService = new EmailNotificationService(
                mailSender,
                studentRepository,
                "noreply@test.local",
                false,
                "http://localhost:5173"
        );

        Report report = new Report();
        report.setId(99);
        report.setStudent("Jane Doe");
        report.setGrade(Grade.GRADE_2A);
        report.setReportType(ReportType.REPORT);

        emailNotificationService.notifyReportCreated(report, null, null, null);

        verify(studentRepository, never()).findByFullNameIgnoreCase(org.mockito.ArgumentMatchers.anyString());
        verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(MimeMessage.class));
    }
}

