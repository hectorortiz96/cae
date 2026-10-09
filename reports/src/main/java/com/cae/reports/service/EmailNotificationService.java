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
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailNotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNotificationService.class);
    private static final DateTimeFormatter ATTACHMENT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final Pattern TEMPLATE_PLACEHOLDER = Pattern.compile("\\$\\{([^}]+)}");

    private final JavaMailSender mailSender;
    private final StudentRepository studentRepository;
    private final String fromAddress;
    private final boolean mailEnabled;
    private final String publicReportBaseUrl;
    private final String reportBodyTemplate;
    private final String reminderBodyTemplate;

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
        this.reportBodyTemplate = loadTemplate("templates/report-email.txt");
        this.reminderBodyTemplate = loadTemplate("templates/report-reminder-email.txt");
    }

    private String loadTemplate(String path) {
        try {
            return new ClassPathResource(path)
                    .getContentAsString(StandardCharsets.UTF_8).replace("\r\n", "\n").stripTrailing();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load email template: " + path, ex);
        }
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

        sendReportEmail(report, student, recipients, pdfAttachment, pdfFileName, pdfMimeType, false);
        LOGGER.info("Sent report-created email for report {} to {}", report.getId(), String.join(", ", recipients));
    }

    public void resendReportEmail(
            Report report,
            byte[] pdfAttachment,
            String pdfFileName,
            String pdfMimeType
    ) {
        if (!mailEnabled) {
            throw new IllegalStateException("Email notifications are disabled");
        }

        String studentName = report.getStudent() == null ? "" : report.getStudent().trim();
        if (studentName.isEmpty()) {
            throw new IllegalStateException("Student name is missing for this report");
        }

        Student student = studentRepository.findByFullNameIgnoreCase(studentName)
                .orElseThrow(() -> new IllegalStateException("Student was not found"));
        List<String> recipients = resolveRecipients(student);
        if (recipients.isEmpty()) {
            throw new IllegalStateException("No contact email addresses were found for this student");
        }

        sendReportEmail(report, student, recipients, pdfAttachment, pdfFileName, pdfMimeType, true);
        LOGGER.info("Resent report email for report {} to {}", report.getId(), String.join(", ", recipients));
    }

    private void sendReportEmail(
            Report report,
            Student student,
            List<String> recipients,
            byte[] pdfAttachment,
            String pdfFileName,
            String pdfMimeType,
            boolean reminder
    ) {
        try {
            boolean hasAttachment = pdfAttachment != null && pdfAttachment.length > 0;
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, hasAttachment, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(recipients.toArray(String[]::new));
            String authorEmail = report.getUser() == null ? null : report.getUser().getEmail();
            if (authorEmail != null && !authorEmail.isBlank()) {
                helper.setCc(authorEmail.trim());
            } else {
                LOGGER.warn("Sending report email without author CC because the author's email is missing (report id={})", report.getId());
            }
            helper.setSubject((reminder ? "Recordatorio: " : "Aviso Importante: ") + report.getReportType().getValue() +
                    " para " + student.getFullName() + " y Confirmación de Recepción");
            helper.setText(buildBody(report, reminder ? reminderBodyTemplate : reportBodyTemplate));

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

    private String buildBody(Report report, String template) {
        String author = report.getUser() == null ? "Coordinación Escolar" : report.getUser().getFullName();
        String reportType = report.getReportType() == null ? "Incidencia Disciplinaria"
                : switch (report.getReportType().getValue()) {
                    case "Reporte" -> "un Reporte Disciplinario";
                    case "Observación" -> "una Observación Disciplinaria";
                    default -> report.getReportType().getValue();
        };

        // Replace placeholders in the template with actual values
        return TEMPLATE_PLACEHOLDER.matcher(template).replaceAll(match -> {
            String value = switch (match.group(1)) {
                case "student" -> String.valueOf(report.getStudent());
                case "grade" -> report.getGrade().getValue();
                case "reportType" -> reportType;
                case "author" -> String.valueOf(author);
                case "reportId" -> String.valueOf(report.getId());
                case "date" -> report.getCreatedAt() == null
                        ? "fecha no disponible"
                        : ATTACHMENT_DATE_FORMAT.format(report.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
                case "publicLink" -> publicReportBaseUrl + "/reports/public/" + report.getId();
                default -> throw new IllegalArgumentException("Unknown report email placeholder: " + match.group(1));
            };
            return Matcher.quoteReplacement(value);
        });
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

    public void sendPasswordResetEmail(String email, String resetLink) {
        if (!mailEnabled) {
            LOGGER.info("Skipping password-reset email because app.mail.enabled=false");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(email);
            helper.setSubject("Password Reset Request");
            helper.setText(buildPasswordResetBody(resetLink));

            mailSender.send(message);
            LOGGER.info("Sent password-reset email to: {}", email);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Failed to send password reset email", ex);
        }
    }

    private String buildPasswordResetBody(String resetLink) {
        return "Hello,\n\n"
                + "You requested to reset your password. Click the link below to proceed:\n\n"
                + resetLink + "\n\n"
                + "This link will expire in 24 hours.\n\n"
                + "If you did not request this, please ignore this email.\n\n"
                + "Best regards,\n"
                + "The CAE Team";
    }

    private String resolveMimeType(String mimeType) {
        String trimmed = mimeType == null ? "" : mimeType.trim();
        if (trimmed.isEmpty()) {
            return "application/pdf";
        }
        return trimmed;
    }
}
