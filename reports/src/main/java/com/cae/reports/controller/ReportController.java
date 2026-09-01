package com.cae.reports.controller;

import com.cae.reports.dto.request.ReportRequest;
import com.cae.reports.dto.response.ReportResponse;
import com.cae.reports.model.Report;
import com.cae.reports.model.User;
import com.cae.reports.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RequestMapping("/reports")
@RestController
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // POST /reports - Create a new report
    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        User currentUser = getCurrentUser();
        Report report = reportService.createReport(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(ReportResponse.fromReport(report));
    }

    // GET /reports - Get all reports
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        List<ReportResponse> reports = reportService.getAllReports().stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // GET /reports/{id} - Get a report by ID
    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Integer id) {
        return reportService.getReportById(id)
                .map(report -> ResponseEntity.ok(ReportResponse.fromReport(report)))
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /reports/me - Get reports created by the current user
    @GetMapping("/me")
    public ResponseEntity<List<ReportResponse>> getMyReports() {
        User currentUser = getCurrentUser();
        List<ReportResponse> reports = reportService.getReportsByUser(currentUser).stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // GET /reports/grade/{grade} - Get reports by grade
    @GetMapping("/grade/{grade}")
    public ResponseEntity<List<ReportResponse>> getReportsByGrade(@PathVariable String grade) {
        List<ReportResponse> reports = reportService.getReportsByGrade(grade).stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // GET /reports/type/{reportType} - Get reports by type
    @GetMapping("/type/{reportType}")
    public ResponseEntity<List<ReportResponse>> getReportsByType(@PathVariable String reportType) {
        List<ReportResponse> reports = reportService.getReportsByReportType(reportType).stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // GET /reports/student/{studentName} - Get reports by student name
    @GetMapping("/student/{studentName}")
    public ResponseEntity<List<ReportResponse>> getReportsByStudentName(@PathVariable String studentName) {
        List<ReportResponse> reports = reportService.getReportsByStudentName(studentName).stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // GET /reports/search?title={title} - Search reports by title
    @GetMapping("/search")
    public ResponseEntity<List<ReportResponse>> searchReportsByTitle(@RequestParam String title) {
        List<ReportResponse> reports = reportService.searchReportsByTitle(title).stream()
                .map(ReportResponse::fromReport)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reports);
    }

    // PUT /reports/{id} - Update a report
    @PutMapping("/{id}")
    public ResponseEntity<ReportResponse> updateReport(@PathVariable Integer id, @Valid @RequestBody ReportRequest request) {
        User currentUser = getCurrentUser();
        Report report = reportService.updateReport(id, request, currentUser);
        return ResponseEntity.ok(ReportResponse.fromReport(report));
    }

    // DELETE /reports/{id} - Delete a report
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Integer id) {
        User currentUser = getCurrentUser();
        reportService.deleteReport(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (User) authentication.getPrincipal();
    }
}

