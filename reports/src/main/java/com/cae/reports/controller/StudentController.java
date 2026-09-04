package com.cae.reports.controller;

import com.cae.reports.dto.response.StudentBatchImportResponse;
import com.cae.reports.dto.response.StudentResponse;
import com.cae.reports.service.StudentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RequestMapping("/students")
@RestController
public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents().stream()
                .map(StudentResponse::fromStudent)
                .toList());
    }

    @GetMapping("/grade/{grade}")
    public ResponseEntity<List<StudentResponse>> getStudentsByGrade(@PathVariable String grade) {
        return ResponseEntity.ok(studentService.getStudentsByGrade(grade).stream()
                .map(StudentResponse::fromStudent)
                .toList());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<List<StudentResponse>> getStudentsByName(@PathVariable String name) {
        return ResponseEntity.ok(studentService.getStudentsByName(name).stream()
                .map(StudentResponse::fromStudent)
                .toList());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentBatchImportResponse> importStudents(@RequestParam("file") MultipartFile file) {
        StudentBatchImportResponse response = studentService.importStudentsFromCsv(file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAllStudents() {
        studentService.deleteAllStudents();
        return ResponseEntity.noContent().build();
    }
}
