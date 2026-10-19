package com.cae.reports.model;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AdvisorTests {

    @Test
    void createsAdvisorWithSingleGrade() {
        Advisor advisor = new Advisor("Jane Doe", "jane@example.com", 1);

        assertEquals("Jane Doe", advisor.getName());
        assertEquals("jane@example.com", advisor.getEmail());
        assertEquals(1, advisor.getGrade());
    }

    @Test
    void updatesAdvisorFields() {
        Advisor advisor = new Advisor();

        advisor.setName("John Doe");
        advisor.setEmail("john@example.com");
        advisor.setGrade(3);

        assertEquals("John Doe", advisor.getName());
        assertEquals("john@example.com", advisor.getEmail());
        assertEquals(3, advisor.getGrade());
    }

    @Test
    void acceptsGradesOneThroughThree() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (int grade = 1; grade <= 3; grade++) {
                Advisor advisor = new Advisor("Jane Doe", "jane@example.com", grade);

                assertTrue(validator.validate(advisor).isEmpty());
            }
        }
    }

    @Test
    void rejectsMissingAndOutOfRangeGrades() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (Integer grade : new Integer[]{null, 0, 4}) {
                Advisor advisor = new Advisor("Jane Doe", "jane@example.com", grade);

                assertTrue(validator.validate(advisor).stream()
                        .anyMatch(v -> v.getPropertyPath().toString().equals("grade")));
            }
        }
    }
}
