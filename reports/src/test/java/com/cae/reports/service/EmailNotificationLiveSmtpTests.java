package com.cae.reports.service;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.Student;
import com.cae.reports.model.User;
import com.cae.reports.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmailNotificationLiveSmtpTests {

    @Test
    void notifyReportCreatedSendsLiveEmailToOneConfiguredRecipient() {
        assumeTrue("true".equalsIgnoreCase(System.getenv("LIVE_EMAIL_TEST")),
                "Skipping live SMTP test. Set LIVE_EMAIL_TEST=true to run.");

        String recipient = requiredEnv("LIVE_EMAIL_RECIPIENT");

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(requiredEnv("MAIL_HOST"));
        mailSender.setPort(Integer.parseInt(envOrDefault("MAIL_PORT", "587")));
        mailSender.setUsername(requiredEnv("MAIL_USERNAME"));
        mailSender.setPassword(requiredEnv("MAIL_PASSWORD"));

        Properties mailProperties = mailSender.getJavaMailProperties();
        mailProperties.put("mail.transport.protocol", "smtp");
        mailProperties.put("mail.smtp.auth", envOrDefault("MAIL_SMTP_AUTH", "true"));
        mailProperties.put("mail.smtp.starttls.enable", envOrDefault("MAIL_SMTP_STARTTLS", "true"));

        StudentRepository studentRepository = mock(StudentRepository.class);
        Student student = new Student("Live Email Test Student", Grade.GRADE_1A, recipient, null);
        when(studentRepository.findByFullNameIgnoreCase("Live Email Test Student")).thenReturn(Optional.of(student));

        // Use SMTP account as sender to avoid provider rejection of local domains.
        EmailNotificationService emailNotificationService = new EmailNotificationService(
                mailSender,
                studentRepository,
                mailSender.getUsername(),
                true,
                envOrDefault("APP_PUBLIC_REPORT_BASE_URL", "http://localhost:5173")
        );

        Report report = new Report();
        report.setId(1_000_001);
        report.setStudent("Live Email Test Student");
        report.setGrade(Grade.GRADE_1A);
        report.setReportType(ReportType.REPORT);

        User author = new User();
        author.setUsername("live-mail-test");
        report.setUser(author);

        assertDoesNotThrow(() -> emailNotificationService.notifyReportCreated(report, null, null, null));
    }

    private static String requiredEnv(String key) {
        String value = System.getenv(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required environment variable: " + key);
        }
        return value;
    }

    private static String envOrDefault(String key, String fallback) {
        String value = System.getenv(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }
}

