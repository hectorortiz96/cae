package com.cae.reports.controller;

import com.cae.reports.dto.request.UpdateStudentRequest;
import com.cae.reports.exceptions.GlobalExceptionHandler;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Student;
import com.cae.reports.service.StudentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringJUnitConfig(StudentControllerTests.Config.class)
class StudentControllerTests {
    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean
        StudentService studentService() {
            return mock(StudentService.class);
        }

        @Bean
        StudentController studentController(StudentService service) {
            return new StudentController(service);
        }
    }

    @Autowired
    private StudentController controller;

    @Autowired
    private StudentService service;

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminsCannotReadOrUpdateStudentDetails() {
        assertThrows(AccessDeniedException.class, () -> controller.getStudentDetails("Jane Doe"));
        assertThrows(AccessDeniedException.class, () -> controller.updateStudent("parent@example.com",
                new UpdateStudentRequest("Jane Doe", "1A", "parent@example.com", null)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminsCanReadAndUpdateStudentDetails() throws Exception {
        Student student = new Student("Jane Doe", Grade.GRADE_1A, "parent@example.com", null);
        when(service.getStudentByFullName("Jane Doe")).thenReturn(student);
        when(service.updateStudent(eq("parent@example.com"), any(UpdateStudentRequest.class))).thenReturn(student);
        var mvc = MockMvcBuilders.standaloneSetup(controller).build();

        mvc.perform(get("/students/details").param("fullName", "Jane Doe"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Jane Doe"));
        mvc.perform(put("/students/details").param("contactemail1", "parent@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Jane Doe","grade":"1A","contactemail1":"parent@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grade").value("1A"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalidUpdatesReturnBadRequest() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler()).build();

        mvc.perform(put("/students/details").param("contactemail1", "parent@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"","grade":"4Z","contactemail1":"invalid"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void missingStudentReturnsNotFoundWithDetails() throws Exception {
        when(service.getStudentByFullName("Missing"))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler()).build();

        mvc.perform(get("/students/details").param("fullName", "Missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Student not found"));
    }
}
