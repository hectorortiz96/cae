package com.cae.reports.repository;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Override
    @EntityGraph(attributePaths = "user")
    List<Report> findAll();

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Report> findById(Integer id);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUser(User user);

    @EntityGraph(attributePaths = "user")
    List<Report> findByStudentName(String studentName);

    @EntityGraph(attributePaths = "user")
    List<Report> findByGrade(Grade grade);

    @EntityGraph(attributePaths = "user")
    List<Report> findByReportType(ReportType reportType);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUserAndGrade(User user, Grade grade);

    @EntityGraph(attributePaths = "user")
    List<Report> findByUserAndReportType(User user, ReportType reportType);
}

