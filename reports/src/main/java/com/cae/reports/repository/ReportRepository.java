package com.cae.reports.repository;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Report;
import com.cae.reports.model.ReportType;
import com.cae.reports.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    List<Report> findByUser(User user);

    List<Report> findByStudentName(String studentName);

    List<Report> findByGrade(Grade grade);

    List<Report> findByReportType(ReportType reportType);

    List<Report> findByUserAndGrade(User user, Grade grade);

    List<Report> findByUserAndReportType(User user, ReportType reportType);

    List<Report> findByTitleContainingIgnoreCase(String title);
}

