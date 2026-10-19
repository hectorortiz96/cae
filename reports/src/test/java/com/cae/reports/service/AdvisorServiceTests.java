package com.cae.reports.service;

import com.cae.reports.model.Advisor;
import com.cae.reports.repository.AdvisorRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.validation.beanvalidation.MethodValidationPostProcessor;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdvisorServiceTests {
    private final AdvisorRepository advisors = mock(AdvisorRepository.class);
    private final AdvisorService service = validatedService();

    @Test
    void listsAllAdvisors() {
        List<Advisor> expected = List.of(advisor());
        when(advisors.findAll()).thenReturn(expected);

        assertEquals(expected, service.getAllAdvisors());
    }

    @Test
    void findsAdvisorByTrimmedEmail() {
        Advisor advisor = advisor();
        when(advisors.findById("jane@example.com")).thenReturn(Optional.of(advisor));

        assertSame(advisor, service.getAdvisorByEmail(" jane@example.com "));
    }

    @Test
    void listsAdvisorsByGrade() {
        List<Advisor> expected = List.of(advisor());
        when(advisors.findByGrade(1)).thenReturn(expected);

        assertEquals(expected, service.getAdvisorsByGrade(1));
    }

    @Test
    void savesAdvisor() {
        Advisor advisor = advisor();
        when(advisors.save(advisor)).thenReturn(advisor);

        assertSame(advisor, service.saveAdvisor(advisor));
        verify(advisors).save(advisor);
    }

    @Test
    void deletesExistingAdvisor() {
        Advisor advisor = advisor();
        when(advisors.findById("jane@example.com")).thenReturn(Optional.of(advisor));

        service.deleteAdvisor(" jane@example.com ");

        verify(advisors).delete(advisor);
    }

    @Test
    void missingAdvisorReturnsNotFound() {
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.getAdvisorByEmail("missing@example.com")).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class,
                () -> service.deleteAdvisor("missing@example.com")).getStatusCode());
        verify(advisors, never()).delete(any(Advisor.class));
    }

    @Test
    void rejectsMissingAndOutOfRangeGrades() {
        for (Integer grade : new Integer[]{null, 0, 4}) {
            assertThrows(ConstraintViolationException.class, () -> service.getAdvisorsByGrade(grade));
            assertThrows(ConstraintViolationException.class,
                    () -> service.saveAdvisor(new Advisor("Jane Doe", "jane@example.com", grade)));
        }
        verifyNoInteractions(advisors);
    }

    @Test
    void rejectsMissingAdvisorAndBlankEmails() {
        assertThrows(ConstraintViolationException.class, () -> service.saveAdvisor(null));
        for (String email : new String[]{null, "", " "}) {
            assertThrows(ConstraintViolationException.class, () -> service.getAdvisorByEmail(email));
            assertThrows(ConstraintViolationException.class, () -> service.deleteAdvisor(email));
        }
        verifyNoInteractions(advisors);
    }

    private AdvisorService validatedService() {
        MethodValidationPostProcessor processor = new MethodValidationPostProcessor();
        processor.afterPropertiesSet();
        return (AdvisorService) processor.postProcessAfterInitialization(
                new AdvisorService(advisors), "advisorService");
    }

    private Advisor advisor() {
        return new Advisor("Jane Doe", "jane@example.com", 1);
    }
}
