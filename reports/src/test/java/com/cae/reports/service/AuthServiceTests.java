package com.cae.reports.service;

import com.cae.reports.dto.request.LoginRequest;
import com.cae.reports.model.User;
import com.cae.reports.repository.PasswordResetTokenRepository;
import com.cae.reports.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTests {

    @Test
    void authenticateAcceptsEmailAndAuthenticatesWithUsername() {
        UserRepository userRepository = mock(UserRepository.class);
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        User user = new User();
        user.setUsername("jane.doe");
        user.setEmail("jane@example.com");

        when(userRepository.findByUsername("jane@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        AuthService authService = new AuthService(
                userRepository,
                mock(PasswordResetTokenRepository.class),
                mock(PasswordEncoder.class),
                authenticationManager,
                mock(EmailNotificationService.class)
        );

        User authenticatedUser = authService.authenticate(new LoginRequest("jane@example.com", "password"));

        assertSame(user, authenticatedUser);
        verify(authenticationManager).authenticate(argThat(authentication ->
                authentication instanceof UsernamePasswordAuthenticationToken token
                        && token.getPrincipal().equals("jane.doe")
                        && token.getCredentials().equals("password")
        ));
    }
}
