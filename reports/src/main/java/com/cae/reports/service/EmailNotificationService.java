package com.cae.reports.service;

import com.cae.reports.model.Report;
import com.cae.reports.model.Student;
import com.cae.reports.repository.StudentRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class EmailNotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final DateTimeFormatter ATTACHMENT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    private final JavaMailSender mailSender;
    private final StudentRepository studentRepository;
    private final String fromAddress;
    private final boolean mailEnabled;
    private final String publicReportBaseUrl;

    public EmailNotificationService(
            JavaMailSender mailSender,
            StudentRepository studentRepository,
            @Value("${app.mail.from:no-reply@cae.local}") String fromAddress,
            @Value("${app.mail.enabled:true}") boolean mailEnabled,
            @Value("${app.public-report.base-url:http://localhost:5173}") String publicReportBaseUrl
    ) {
        this.mailSender = mailSender;
        this.studentRepository = studentRepository;
        this.fromAddress = fromAddress;
        this.mailEnabled = mailEnabled;
        this.publicReportBaseUrl = normalizeBaseUrl(publicReportBaseUrl);
    }

    public void notifyReportCreated(Report report, byte[] pdfAttachment, String pdfFileName, String pdfMimeType) {
        if (!mailEnabled) {
            LOGGER.info("Skipping report-created email because app.mail.enabled=false (report id={})", report.getId());
            return;
        }

        String studentName = report.getStudent() == null ? "" : report.getStudent().trim();
        if (studentName.isEmpty()) {
            LOGGER.warn("Skipping report-created email because student name is missing for report {}", report.getId());
            return;
        }

        Student student = studentRepository.findByFullNameIgnoreCase(studentName).orElse(null);
        if (student == null) {
            LOGGER.warn("Skipping report-created email because student '{}' was not found", studentName);
            return;
        }

        List<String> recipients = resolveRecipients(student);
        if (recipients.isEmpty()) {
            LOGGER.warn("Skipping report-created email because no contact emails were found for student '{}'", student.getFullName());
            return;
        }

        sendReportEmail(report, student, recipients, pdfAttachment, pdfFileName, pdfMimeType);
        LOGGER.info("Sent report-created email for report {} to {}", report.getId(), String.join(", ", recipients));
    }

    private void sendReportEmail(
            Report report,
            Student student,
            List<String> recipients,
            byte[] pdfAttachment,
            String pdfFileName,
            String pdfMimeType
    ) {
        try {
            boolean hasAttachment = pdfAttachment != null && pdfAttachment.length > 0;
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, hasAttachment, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(recipients.toArray(String[]::new));
            helper.setSubject("New report for " + student.getFullName());
            helper.setText(buildBody(report));

            if (hasAttachment) {
                helper.addAttachment(
                        resolveAttachmentName(report),
                        new ByteArrayResource(pdfAttachment),
                        resolveMimeType(pdfMimeType)
                );
            }

            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Failed to build report notification email", ex);
        }
    }

    private List<String> resolveRecipients(Student student) {
        Set<String> uniqueRecipients = new LinkedHashSet<>();

        addRecipient(uniqueRecipients, student.getContactemail1());
        addRecipient(uniqueRecipients, student.getContactemail2());

        return new ArrayList<>(uniqueRecipients);
    }

    private void addRecipient(Set<String> recipients, String value) {
        if (value != null && !value.trim().isEmpty()) {
            recipients.add(value.trim());
        }
    }

    private String buildBody(Report report) {
        String author = report.getUser() == null ? "Unknown" : report.getUser().getUsername();

        return "A new report has been created.\n\n"
                + "Student: " + report.getStudent() + "\n"
                + "Grade: " + report.getGrade().getValue() + "\n"
                + "Type: " + report.getReportType().getValue() + "\n"
                + "Author: " + author + "\n"
                + "Report ID: " + report.getId() + "\n"
                + "Public link: " + publicReportBaseUrl + "/reports/public/" + report.getId();
    }

    private String normalizeBaseUrl(String baseUrl) {
        String trimmed = baseUrl == null ? "" : baseUrl.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String resolveAttachmentName(Report report) {
        String reportType = report.getReportType() == null ? "report" : report.getReportType().getValue().toUpperCase();
        String reportDate = report.getCreatedAt() == null
                ? ""
                : ATTACHMENT_DATE_FORMAT.format(report.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        return reportType + "_" + report.getStudent() + "_" + reportDate + ".pdf";
    }

    private String resolveMimeType(String mimeType) {
        String trimmed = mimeType == null ? "" : mimeType.trim();
        if (trimmed.isEmpty()) {
            return "application/pdf";
        }
        return trimmed;
    }
}

