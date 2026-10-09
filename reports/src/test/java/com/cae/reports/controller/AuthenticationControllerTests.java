package com.cae.reports.controller;

import com.cae.reports.dto.request.ForgotPasswordRequest;
import com.cae.reports.model.PasswordResetToken;
import com.cae.reports.service.AuthService;
import com.cae.reports.service.EmailNotificationService;
import com.cae.reports.service.JwtService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthenticationControllerTests {

    @ParameterizedTest
    @ValueSource(strings = {"https://school.example.com", "https://school.example.com/"})
    void forgotPasswordUsesConfiguredFrontendUrl(String baseUrl) {
        AuthService authService = mock(AuthService.class);
        EmailNotificationService emails = mock(EmailNotificationService.class);
        AuthenticationController controller = new AuthenticationController(
                mock(JwtService.class), authService, emails, baseUrl
        );
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("reset-token");
        when(authService.createPasswordResetToken("teacher@cae.edu.mx")).thenReturn(token);

        var response = controller.forgotPassword(new ForgotPasswordRequest("teacher@cae.edu.mx"));

        assertEquals(200, response.getStatusCode().value());
        verify(emails).sendPasswordResetEmail(
                "teacher@cae.edu.mx", "https://school.example.com/reset-password?token=reset-token"
        );
    }
}
