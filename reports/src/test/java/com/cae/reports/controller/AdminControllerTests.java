package com.cae.reports.controller;

import com.cae.reports.dto.request.AdminUpdateUserRequest;
import com.cae.reports.dto.request.UpdateStudentRequest;
import com.cae.reports.exceptions.GlobalExceptionHandler;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Student;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import com.cae.reports.repository.UserRepository;
import com.cae.reports.service.ReportService;
import com.cae.reports.service.StudentService;
import com.cae.reports.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitConfig(AdminControllerTests.Config.class)
class AdminControllerTests {
    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean
        UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        ReportRepository reportRepository() {
            return mock(ReportRepository.class);
        }

        @Bean
        StudentService studentService() {
            return mock(StudentService.class);
        }

        @Bean
        UserService userService() {
            return mock(UserService.class);
        }

        @Bean
        ReportService reportService() {
            return mock(ReportService.class);
        }

        @Bean
        AdminController adminController(
                UserRepository users,
                ReportRepository reports,
                StudentService students,
                UserService userService,
                ReportService reportService
        ) {
            return new AdminController(users, reports, students, userService, reportService);
        }
    }

    @Autowired
    private AdminController controller;

    @Autowired
    private StudentService studentService;

    @Autowired
    private UserService userService;

    @Autowired
    private ReportService reportService;

    @BeforeEach
    void resetReportService() {
        reset(reportService);
    }

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminsCannotDeleteReportsBeforeDate() {
        assertThrows(AccessDeniedException.class,
                () -> controller.deleteReportsBefore(LocalDate.of(2026, 10, 1)));
        verifyNoInteractions(reportService);
    }

    @Test
    @WithAnonymousUser
    void anonymousUsersCannotDeleteReportsBeforeDate() {
        assertThrows(AccessDeniedException.class,
                () -> controller.deleteReportsBefore(LocalDate.of(2026, 10, 1)));
        verifyNoInteractions(reportService);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 7})
    @WithMockUser(roles = "ADMIN")
    void adminsCanDeleteReportsBeforeDate(int deletedCount) throws Exception {
        LocalDate before = LocalDate.of(2026, 10, 1);
        when(reportService.deleteReportsBefore(before)).thenReturn(deletedCount);
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(delete("/admin/reports").param("before", "2026-10-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deletedCount").value(deletedCount));

        verify(reportService).deleteReportsBefore(before);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "not-a-date", "2026-02-30", "10/01/2026", "2026-10-01T00:00:00Z"})
    @WithMockUser(roles = "ADMIN")
    void rejectsInvalidReportDeletionDates(String before) throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(delete("/admin/reports").param("before", before))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(reportService);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void requiresReportDeletionDate() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(delete("/admin/reports"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(reportService);
    }

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminsCannotUpdateUsers() {
        assertThrows(AccessDeniedException.class, () -> controller.updateUser(
                1, new AdminUpdateUserRequest("new-name", "New Name", "new@example.com")));
    }

    @Test
    @WithAnonymousUser
    void anonymousUsersCannotUpdateUsers() {
        assertThrows(AccessDeniedException.class, () -> controller.updateUser(
                1, new AdminUpdateUserRequest("new-name", "New Name", "new@example.com")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminsCanUpdateUserInfo() throws Exception {
        User user = new User();
        user.setId(1);
        user.setUsername("new-name");
        user.setFullName("New Name");
        user.setEmail("new@example.com");
        user.setPassword("secret");
        var request = new AdminUpdateUserRequest("new-name", "New Name", "new@example.com");
        when(userService.updateUser(1, request)).thenReturn(user);
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(put("/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":" new-name ","fullName":" New Name ","email":" new@example.com "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("new-name"))
                .andExpect(jsonPath("$.fullName").value("New Name"))
                .andExpect(jsonPath("$.email").value("new@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());

        verify(userService).updateUser(1, request);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{\"username\":\"ab\",\"fullName\":\"Name\",\"email\":\"valid@example.com\"}",
            "{\"username\":\"valid\",\"fullName\":\" \",\"email\":\"valid@example.com\"}",
            "{\"username\":\"valid\",\"fullName\":\"Name\",\"email\":\"invalid\"}",
            "{\"username\":\"valid\",\"fullName\":\"Name\",\"email\":\" \"}",
            "{}"
    })
    @WithMockUser(roles = "ADMIN")
    void rejectsInvalidUserInfo(String body) throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(put("/admin/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "USER")
    void nonAdminsCannotUpdateStudents() {
        assertThrows(AccessDeniedException.class, () -> controller.updateStudent(
                "parent@example.com",
                new UpdateStudentRequest("Jane Doe", "1A", "parent@example.com", null)
        ));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminsCanUpdateStudentsByCurrentPrimaryEmail() throws Exception {
        Student updatedStudent = new Student(
                "Jane Smith",
                Grade.GRADE_2B,
                "new-parent@example.com",
                "second@example.com"
        );
        when(studentService.updateStudent(eq("parent@example.com"), any(UpdateStudentRequest.class)))
                .thenReturn(updatedStudent);
        var mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(put("/admin/students").param("contactemail1", "parent@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Jane Smith","grade":"2B","contactemail1":"new-parent@example.com","contactemail2":"second@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Jane Smith"))
                .andExpect(jsonPath("$.grade").value("2B"))
                .andExpect(jsonPath("$.contactemail1").value("new-parent@example.com"))
                .andExpect(jsonPath("$.contactemail2").value("second@example.com"));

        verify(studentService).updateStudent(eq("parent@example.com"), any(UpdateStudentRequest.class));
    }
}
