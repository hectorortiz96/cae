package com.cae.reports.controller;

import com.cae.reports.dto.request.ForgotPasswordRequest;
import com.cae.reports.dto.request.LoginRequest;
import com.cae.reports.dto.request.RegisterRequest;
import com.cae.reports.dto.request.ResetPasswordRequest;
import com.cae.reports.dto.response.LoginResponse;
import com.cae.reports.dto.response.PasswordResetResponse;
import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.PasswordResetToken;
import com.cae.reports.model.User;
import com.cae.reports.service.AuthService;
import com.cae.reports.service.EmailNotificationService;
import com.cae.reports.service.JwtService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RequestMapping("/auth")
@RestController
public class AuthenticationController {
    private static final Logger LOGGER = LoggerFactory.getLogger(AuthenticationController.class);

    private final JwtService jwtService;
    private final AuthService authService;
    private final EmailNotificationService emailNotificationService;
    private final String publicReportBaseUrl;

    public AuthenticationController(
            JwtService jwtService,
            AuthService authService,
            EmailNotificationService emailNotificationService,
            @Value("${app.public-report.base-url}") String publicReportBaseUrl
    ) {
        this.jwtService = jwtService;
        this.authService = authService;
        this.emailNotificationService = emailNotificationService;
        this.publicReportBaseUrl = publicReportBaseUrl;
    }

    // POST /auth/signup
    @PostMapping("/signup")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest registerUserDto) {
        User registeredUser = authService.register(registerUserDto);
        return ResponseEntity.ok(UserResponse.fromUser(registeredUser));
    }

    // POST /auth/login
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@Valid @RequestBody LoginRequest loginUserDto) {
        User authenticatedUser = authService.authenticate(loginUserDto);

        String jwtToken = jwtService.generateToken(authenticatedUser);
        LoginResponse loginResponse = new LoginResponse(
                jwtToken,
                jwtService.getExpirationTime(),
                UserResponse.fromUser(authenticatedUser)
        );

        return ResponseEntity.ok(loginResponse);
    }

    // POST /auth/forgot-password
    @PostMapping("/forgot-password")
    public ResponseEntity<PasswordResetResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        try {
            PasswordResetToken resetToken = authService.createPasswordResetToken(request.getEmail());
            
            // Send email with reset link
            String resetLink = UriComponentsBuilder.fromUriString(publicReportBaseUrl)
                    .pathSegment("reset-password")
                    .queryParam("token", resetToken.getToken())
                    .build()
                    .encode()
                    .toUriString();
            emailNotificationService.sendPasswordResetEmail(request.getEmail(), resetLink);
            
            LOGGER.info("Password reset token created for email: {}", request.getEmail());
            return ResponseEntity.ok(new PasswordResetResponse(
                    "Password reset email sent successfully",
                    true
            ));
        } catch (IllegalArgumentException e) {
            LOGGER.warn("Forgot password request for non-existent email: {}", request.getEmail());
            return ResponseEntity.ok(new PasswordResetResponse(
                    "If an account exists with this email, a reset link has been sent",
                    true
            ));
        }
    }

    // POST /auth/reset-password
    @PostMapping("/reset-password")
    public ResponseEntity<PasswordResetResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        try {
            authService.resetPassword(request);
            LOGGER.info("Password reset successfully");
            return ResponseEntity.ok(new PasswordResetResponse(
                    "Password reset successfully",
                    true
            ));
        } catch (IllegalArgumentException e) {
            LOGGER.warn("Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new PasswordResetResponse(
                    e.getMessage(),
                    false
            ));
        }
    }
}
