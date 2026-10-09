package com.cae.reports.service;

import com.cae.reports.dto.request.LoginRequest;
import com.cae.reports.dto.request.RegisterRequest;
import com.cae.reports.dto.request.ResetPasswordRequest;
import com.cae.reports.model.PasswordResetToken;
import com.cae.reports.model.User;
import com.cae.reports.repository.PasswordResetTokenRepository;
import com.cae.reports.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailNotificationService emailNotificationService;

    public AuthService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            EmailNotificationService emailNotificationService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailNotificationService = emailNotificationService;
    }

    // Registers a new user
    public User register(RegisterRequest input) {
        User user = new User();
        user.setUsername(input.getUsername());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setFullName(input.getFullName());
        user.setEmail(input.getEmail());

        return userRepository.save(user);
    }

    // Validates user credentials on login and returns the user if successful
    public User authenticate(LoginRequest input) {
        User user = userRepository.findByUsername(input.getUsername())
                .or(() -> userRepository.findByEmail(input.getUsername()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        input.getPassword()
                )
        );

        return user;
    }

    // Generates a password reset token and sends an email
    public PasswordResetToken createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User with email not found: " + email));

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUserId(user.getId());

        // Generate token - valid for 24 hours
        String token = UUID.randomUUID().toString();
        Date expiryDate = new Date(System.currentTimeMillis() + (24 * 60 * 60 * 1000));
        PasswordResetToken resetToken = new PasswordResetToken(user, token, expiryDate);
        
        return passwordResetTokenRepository.save(resetToken);
    }

    // Resets user password using token
    public void resetPassword(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        // Check if token is expired
        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new IllegalArgumentException("Reset token has expired");
        }

        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        // Delete the token
        passwordResetTokenRepository.delete(resetToken);
    }
}
