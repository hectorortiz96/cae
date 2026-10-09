package com.cae.reports.repository;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Override
    @EntityGraph(attributePaths = "user")
    @Query("SELECT report FROM Report report ORDER BY report.createdAt ASC, report.id ASC")
    List<Report> findAll();

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Report> findById(Integer id);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUserOrderByCreatedAtAscIdAsc(User user);

    @EntityGraph(attributePaths = "user")
    List<Report> findByStudentContainingIgnoreCaseOrderByCreatedAtAscIdAsc(String student);

    List<Report> findByStudentIgnoreCase(String student);

    @EntityGraph(attributePaths = "user")
    List<Report> findByGradeOrderByCreatedAtAscIdAsc(Grade grade);

    @EntityGraph(attributePaths = "user")
    List<Report> findByReportTypeOrderByCreatedAtAscIdAsc(ReportType reportType);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUserAndGradeOrderByCreatedAtAscIdAsc(User user, Grade grade);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUserAndReportTypeOrderByCreatedAtAscIdAsc(User user, ReportType reportType);
}
