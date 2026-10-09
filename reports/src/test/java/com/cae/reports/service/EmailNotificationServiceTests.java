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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
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
import static org.junit.jupiter.api.Assertions.assertNull;
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
        report.setContent("Report content with placeholders: ${placeholder1}, ${placeholder2}");
        report.setReceived(false);
        User author = new User();
        author.setUsername("teacher1");
        author.setFullName("María García");
        author.setEmail("teacher1@cae.edu.mx");
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
                new String[]{"teacher1@cae.edu.mx"},
                Arrays.stream(mimeMessage.getRecipients(MimeMessage.RecipientType.CC)).map(Address::toString).toArray(String[]::new)
        );
        assertArrayEquals(
                new String[]{"family1@test.local", "family2@test.local"},
                Arrays.stream(mimeMessage.getRecipients(MimeMessage.RecipientType.TO)).map(Address::toString).toArray(String[]::new)
        );
        assertEquals("Aviso Importante: Reporte para Jane Doe y Confirmación de Recepción", mimeMessage.getSubject());

        MimeMultipart content = (MimeMultipart) mimeMessage.getContent();
        assertEquals(2, content.getCount());
        MimeMultipart body = (MimeMultipart) content.getBodyPart(0).getContent();
        assertEquals(
                expectedReportBody("Jane Doe", "un Reporte Disciplinario", "09-09-2026", "María García"),
                body.getBodyPart(0).getContent()
        );

        BodyPart attachmentPart = content.getBodyPart(1);
        assertEquals("REPORTE_Jane Doe_09-09-2026.pdf", attachmentPart.getFileName());
    }

    @Test
    void resendReportEmailSendsReminderAndPdfToStudentContacts() throws Exception {
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

        Student student = new Student("Jane Doe", Grade.GRADE_2A, "family@test.local", null);
        when(studentRepository.findByFullNameIgnoreCase("Jane Doe")).thenReturn(Optional.of(student));

        Report report = new Report();
        report.setId(42);
        report.setStudent("Jane Doe");
        report.setGrade(Grade.GRADE_2A);
        report.setReportType(ReportType.REPORT);
        report.setCreatedAt(Date.from(LocalDate.of(2026, 9, 9).atStartOfDay(ZoneId.systemDefault()).toInstant()));
        User author = new User();
        author.setUsername("teacher1");
        author.setFullName("María García");
        author.setEmail(" teacher1@cae.edu.mx ");
        report.setUser(author);

        emailNotificationService.resendReportEmail(
                report,
                "pdf-bytes".getBytes(StandardCharsets.UTF_8),
                "report-42.pdf",
                "application/pdf"
        );

        verify(mailSender).send(mimeMessage);
        assertArrayEquals(
                new String[]{"teacher1@cae.edu.mx"},
                Arrays.stream(mimeMessage.getRecipients(MimeMessage.RecipientType.CC)).map(Address::toString).toArray(String[]::new)
        );
        assertArrayEquals(
                new String[]{"family@test.local"},
                Arrays.stream(mimeMessage.getRecipients(MimeMessage.RecipientType.TO)).map(Address::toString).toArray(String[]::new)
        );
        assertEquals("Recordatorio: Reporte para Jane Doe y Confirmación de Recepción", mimeMessage.getSubject());
        MimeMultipart content = (MimeMultipart) mimeMessage.getContent();
        assertEquals(2, content.getCount());
        MimeMultipart body = (MimeMultipart) content.getBodyPart(0).getContent();
        assertEquals(
                expectedReminderBody("Jane Doe", "un Reporte Disciplinario", "09-09-2026", "María García"),
                body.getBodyPart(0).getContent()
        );
        assertEquals("REPORTE_Jane Doe_09-09-2026.pdf", content.getBodyPart(1).getFileName());
    }

    @Test
    void reportEmailPreservesPlaceholderSyntaxInReportValues() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        EmailNotificationService emailNotificationService = new EmailNotificationService(
                mailSender, studentRepository, "noreply@test.local", true, "http://localhost:5173/"
        );
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        String studentName = "Jane ${grade} $5\\Doe";
        Student student = new Student(studentName, Grade.GRADE_2A, "family@test.local", null);
        when(studentRepository.findByFullNameIgnoreCase(studentName)).thenReturn(Optional.of(student));

        Report report = new Report();
        report.setId(42);
        report.setStudent(studentName);
        report.setGrade(Grade.GRADE_2A);
        report.setReportType(ReportType.OBSERVATION);

        emailNotificationService.notifyReportCreated(report, null, null, null);

        verify(mailSender).send(mimeMessage);
        assertNull(mimeMessage.getRecipients(MimeMessage.RecipientType.CC));
        assertEquals("Aviso Importante: Observación para " + studentName + " y Confirmación de Recepción", mimeMessage.getSubject());
        assertEquals(
                expectedReportBody(studentName, "una Observación Disciplinaria", "fecha no disponible", "Coordinación Escolar"),
                mimeMessage.getContent()
        );
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void reportEmailStillSendsWhenAuthorEmailIsMissing(String authorEmail) throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        EmailNotificationService service = new EmailNotificationService(
                mailSender, studentRepository, "noreply@test.local", true, "http://localhost:5173"
        );
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        Student student = new Student("Jane Doe", Grade.GRADE_2A, "family@test.local", null);
        when(studentRepository.findByFullNameIgnoreCase("Jane Doe")).thenReturn(Optional.of(student));

        Report report = new Report();
        report.setId(42);
        report.setStudent("Jane Doe");
        report.setGrade(Grade.GRADE_2A);
        report.setReportType(ReportType.REPORT);
        User author = new User();
        author.setEmail(authorEmail);
        report.setUser(author);

        service.notifyReportCreated(report, null, null, null);

        verify(mailSender).send(message);
        assertNull(message.getRecipients(MimeMessage.RecipientType.CC));
        assertEquals("family@test.local", message.getRecipients(MimeMessage.RecipientType.TO)[0].toString());
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

    private String expectedReportBody(String student, String reportType, String date, String author) {
        return """
                Estimados padres de familia:

                Por medio de la presente les informamos que su hijo(a), %s, del grupo 2A, recibió %s el día %s debido a una situación ocurrida durante su estancia en la escuela.

                Adjunto al correo encontrarán un archivo PDF con la informacion completa para su revisión.

                Con el fin de mantenerlos informados y dar seguimiento oportuno a este asunto, les solicitamos ingresar a nuestro portal para revisar los detalles y confirmar su recepción.

                Sitio de confirmación:
                http://localhost:5173/reports/public/42

                Les agradeceremos confirmación a la brevedad posible. En caso de tener alguna duda, favor de comunicarse con el maestro(a).

                Agradecemos su atención y apoyo para continuar fortaleciendo el desarrollo académico y formativo de su hijo(a).

                Atentamente,
                %s""".formatted(student, reportType, date, author);
    }

    private String expectedReminderBody(String student, String reportType, String date, String author) {
        return """
                Estimados padres de familia:

                Les enviamos un recordatorio para revisar y confirmar la recepción de %s correspondiente a su hijo(a), %s, del grupo 2A, emitido el día %s.

                Este correo da seguimiento al aviso enviado anteriormente y no corresponde a una nueva incidencia.

                Les solicitamos ingresar al siguiente enlace para consultar los detalles y confirmar su recepción:

                Sitio de confirmación:
                http://localhost:5173/reports/public/42

                Si ya confirmaron la recepción, pueden omitir este recordatorio. En caso de tener alguna duda, favor de comunicarse con el maestro(a).

                Agradecemos su atención y apoyo.

                Atentamente,
                %s""".formatted(reportType, student, date, author);
    }
}
