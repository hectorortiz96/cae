package com.cae.reports.repository;

import com.cae.reports.model.Advisor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvisorRepository extends JpaRepository<Advisor, String> {
    List<Advisor> findByGrade(Integer grade);
}
