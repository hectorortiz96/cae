package com.cae.reports.service;

import com.cae.reports.dto.request.UpdateStudentRequest;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.Student;
import com.cae.reports.repository.ReportRepository;
import com.cae.reports.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StudentServiceTests {
    private final StudentRepository students = mock(StudentRepository.class);
    private final ReportRepository reports = mock(ReportRepository.class);
    private final StudentService service = new StudentService(students, reports);

    @Test
    void getsStudentByExactTrimmedName() {
        Student student = student();
        when(students.findByFullNameIgnoreCase("Jane Doe")).thenReturn(Optional.of(student));

        assertSame(student, service.getStudentByFullName(" Jane Doe "));
    }

    @Test
    void missingStudentReturnsNotFound() {
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.getStudentByFullName("Missing Student")).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.updateStudent("missing@example.com", request())).getStatusCode());
        verifyNoInteractions(reports);
    }

    @Test
    void renamesReportsButPreservesHistoricalGrade() {
        Student student = student();
        Report report = new Report();
        report.setStudent("Jane Doe");
        report.setGrade(Grade.GRADE_1A);
        when(students.findById("parent@example.com")).thenReturn(Optional.of(student));
        when(reports.findByStudentIgnoreCase("Jane Doe")).thenReturn(List.of(report));
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Student result = service.updateStudent("parent@example.com", request());

        assertEquals("Jane Smith", result.getFullName());
        assertEquals(Grade.GRADE_2B, result.getGrade());
        assertEquals("Jane Smith", report.getStudent());
        assertEquals(Grade.GRADE_1A, report.getGrade());
        assertNull(result.getContactemail2());
        verify(reports).saveAll(List.of(report));
        verify(students, never()).delete(any(Student.class));
    }

    @Test
    void replacesRowWhenPrimaryEmailChanges() {
        Student original = student();
        when(students.findById("parent@example.com")).thenReturn(Optional.of(original));
        when(students.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Student result = service.updateStudent("parent@example.com",
                new UpdateStudentRequest("Jane Doe", "2B", "new@example.com", "second@example.com"));

        assertEquals("parent@example.com", original.getContactemail1());
        assertEquals("new@example.com", result.getContactemail1());
        assertEquals("second@example.com", result.getContactemail2());
        var order = inOrder(students);
        order.verify(students).delete(original);
        order.verify(students).flush();
        order.verify(students).save(result);
        verifyNoInteractions(reports);
    }

    @Test
    void rejectsDuplicateNameBeforeChangingReports() {
        when(students.findById("parent@example.com")).thenReturn(Optional.of(student()));
        when(students.existsByFullNameIgnoreCaseAndContactemail1Not("Jane Smith", "parent@example.com"))
                .thenReturn(true);

        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.updateStudent("parent@example.com", request())).getStatusCode());
        verify(students, never()).save(any(Student.class));
        verifyNoInteractions(reports);
    }

    @Test
    void rejectsDuplicatePrimaryEmailBeforeChangingReports() {
        when(students.findById("parent@example.com")).thenReturn(Optional.of(student()));
        when(students.existsByContactemail1IgnoreCaseAndContactemail1Not("taken@example.com", "parent@example.com"))
                .thenReturn(true);

        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> service.updateStudent("parent@example.com",
                        new UpdateStudentRequest("Jane Smith", "2B", "taken@example.com", null))).getStatusCode());
        verify(students, never()).delete(any(Student.class));
        verifyNoInteractions(reports);
    }

    private Student student() {
        return new Student("Jane Doe", Grade.GRADE_1A, "parent@example.com", "second@example.com");
    }

    private UpdateStudentRequest request() {
        return new UpdateStudentRequest("Jane Smith", "2B", "parent@example.com", "");
    }
}
