package com.cae.reports.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateStudentRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 150, message = "Full name must not exceed 150 characters")
        String fullName,
        @NotBlank(message = "Grade is required")
        @Pattern(regexp = "[123][ABC]", message = "Invalid grade")
        String grade,
        @NotBlank(message = "Primary contact email is required")
        @Email(message = "Invalid primary contact email")
        @Size(max = 100, message = "Primary contact email must not exceed 100 characters")
        String contactemail1,
        @Email(message = "Invalid secondary contact email")
        @Size(max = 100, message = "Secondary contact email must not exceed 100 characters")
        String contactemail2
) {
    public UpdateStudentRequest {
        fullName = fullName == null ? null : fullName.trim();
        grade = grade == null ? null : grade.trim();
        contactemail1 = contactemail1 == null ? null : contactemail1.trim();
        contactemail2 = contactemail2 == null || contactemail2.isBlank() ? null : contactemail2.trim();
    }
}
