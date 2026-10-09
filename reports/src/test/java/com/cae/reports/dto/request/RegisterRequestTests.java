package com.cae.reports.dto.request;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestTests {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsCaeEmailDomainCaseInsensitively() {
        RegisterRequest request = new RegisterRequest("jane", "password", "jane@cae.edu.mx", "Jane Doe");

        assertTrue(validator.validate(request).isEmpty());

        request.setEmail("jane@CAE.EDU.MX");
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsEmailsOutsideCaeDomain() {
        RegisterRequest request = new RegisterRequest("jane", "password", "jane@example.com", "Jane Doe");

        assertTrue(validator.validate(request).stream()
                .anyMatch(violation -> violation.getMessage().equals("Email must use the @cae.edu.mx domain")));
    }
}
