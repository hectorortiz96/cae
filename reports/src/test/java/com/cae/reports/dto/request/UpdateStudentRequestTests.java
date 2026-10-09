package com.cae.reports.dto.request;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UpdateStudentRequestTests {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void trimsFieldsAndAcceptsEmptyOptionalEmail() {
        UpdateStudentRequest request = new UpdateStudentRequest(" Jane Doe ", " 1A ", " parent@example.com ", " ");

        assertEquals("Jane Doe", request.fullName());
        assertEquals("1A", request.grade());
        assertEquals("parent@example.com", request.contactemail1());
        assertNull(request.contactemail2());
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsBlankNameInvalidGradeAndInvalidEmails() {
        var violations = validator.validate(new UpdateStudentRequest(" ", "4Z", "invalid", "invalid"));

        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("fullName")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("grade")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("contactemail1")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("contactemail2")));
    }

    @Test
    void rejectsValuesExceedingDatabaseLengths() {
        var violations = validator.validate(new UpdateStudentRequest("x".repeat(151), "1A",
                "x".repeat(90) + "@example.com", "x".repeat(90) + "@example.com"));

        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("fullName")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("contactemail1")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("contactemail2")));
    }
}
