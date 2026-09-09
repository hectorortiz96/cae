package com.cae.reports.repository;

import com.cae.reports.model.Grade;
import com.cae.reports.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    boolean existsByFullNameIgnoreCase(String fullName);

    Optional<Student> findByFullNameIgnoreCase(String fullName);

    List<Student> findByGrade(Grade grade);

    List<Student> findByFullNameContainingIgnoreCase(String fullName);
}
