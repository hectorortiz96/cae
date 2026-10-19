package com.cae.reports.service;

import com.cae.reports.model.Advisor;
import com.cae.reports.repository.AdvisorRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Validated
public class AdvisorService {
    private final AdvisorRepository advisorRepository;

    public AdvisorService(AdvisorRepository advisorRepository) {
        this.advisorRepository = advisorRepository;
    }

    public List<Advisor> getAllAdvisors() {
        return advisorRepository.findAll();
    }

    public Advisor getAdvisorByEmail(@NotBlank String email) {
        return advisorRepository.findById(email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Advisor not found"));
    }

    public List<Advisor> getAdvisorsByGrade(@NotNull @Min(1) @Max(3) Integer grade) {
        return advisorRepository.findByGrade(grade);
    }

    @Transactional
    public Advisor saveAdvisor(@NotNull @Valid Advisor advisor) {
        return advisorRepository.save(advisor);
    }

    @Transactional
    public void deleteAdvisor(@NotBlank String email) {
        Advisor advisor = getAdvisorByEmail(email);
        advisorRepository.delete(advisor);
    }
}
