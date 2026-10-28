package com.cae.reports.controller;

import com.cae.reports.dto.request.AdminUpdateUserRequest;
import com.cae.reports.dto.request.UpdateRoleRequest;
import com.cae.reports.dto.request.UpdateStudentRequest;
import com.cae.reports.dto.response.DeleteReportsResponse;
import com.cae.reports.dto.response.ReportResponse;
import com.cae.reports.dto.response.StudentResponse;
import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.User;
import com.cae.reports.repository.ReportRepository;
import com.cae.reports.repository.UserRepository;
import com.cae.reports.service.ReportService;
import com.cae.reports.service.StudentService;
import com.cae.reports.service.UserService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

// Admin-only endpoints for user, student, and report management
// All endpoints require ADMIN role
@RequestMapping("/admin")
@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final StudentService studentService;
    private final UserService userService;
    private final ReportService reportService;

    public AdminController(
            UserRepository userRepository,
            ReportRepository reportRepository,
            StudentService studentService,
            UserService userService,
            ReportService reportService
    ) {

        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.studentService = studentService;
        this.userService = userService;
        this.reportService = reportService;
    }

    // GET /admin/users - Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::fromUser)
                .toList();
        return ResponseEntity.ok(users);
    }

    // GET /admin/users/{id} - Get user by ID
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ResponseEntity.ok(UserResponse.fromUser(userService.updateUser(id, request)));
    }

    // GET /admin/users/{id}/reports - Get all reports created by a user
    @GetMapping("/users/{id}/reports")
    public ResponseEntity<List<ReportResponse>> getReportsByUserId(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        List<ReportResponse> reports = reportRepository.findByUserOrderByCreatedAtAscIdAsc(user)
                .stream()
                .map(ReportResponse::fromReport)
                .toList();

        return ResponseEntity.ok(reports);
    }

    // PUT /admin/students?contactemail1=... - Update a student using their current primary contact email
    @PutMapping("/students")
    public ResponseEntity<StudentResponse> updateStudent(
            @RequestParam String contactemail1,
            @Valid @RequestBody UpdateStudentRequest request
    ) {
        return ResponseEntity.ok(StudentResponse.fromStudent(
                studentService.updateStudent(contactemail1, request)
        ));
    }

    // PUT /admin/users/{id}/role - Update user role
    // Example request body: { "role": "ADMIN" }
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setRole(request.getRole());
        userRepository.save(user);
        
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    @DeleteMapping("/reports")
    public ResponseEntity<DeleteReportsResponse> deleteReportsBefore(
            @RequestParam("before") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate before
    ) {
        return ResponseEntity.ok(new DeleteReportsResponse(reportService.deleteReportsBefore(before)));
    }

    // DELETE /admin/users/{id} - Delete user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
