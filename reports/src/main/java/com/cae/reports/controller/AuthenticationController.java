package com.cae.reports.controller;

import com.cae.reports.dto.request.LoginRequest;
import com.cae.reports.dto.request.RegisterRequest;
import com.cae.reports.dto.response.LoginResponse;
import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.User;
import com.cae.reports.service.AuthService;
import com.cae.reports.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/auth")
@RestController
public class AuthenticationController {
    // Generates JWT tokens
    private final JwtService jwtService;
    // Handles signup/login logic
    private final AuthService authService;

    public AuthenticationController(JwtService jwtService, AuthService authService) {
        this.jwtService = jwtService;
        this.authService = authService;
    }

    // POST /auth/signup
    // Registers a new user and returns the created user details
    // Example request body:
    // {
    //   "username": "john",
    //   "password": "secret123",
    //   "email": "john@example.com",
    //   "fullName": "John Doe"
    // }
    // Example response body:
    // {
    //   "id": 1,
    //   "username": "john",
    //   "email": "john@example.com",
    //   "fullName": "John Doe",
    //   "createdAt": "2026-08-27T...",
    //   "updatedAt": "2026-08-27T..."
    // }
    @PostMapping("/signup")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest registerUserDto) {
        User registeredUser = authService.signup(registerUserDto);

        return ResponseEntity.ok(UserResponse.fromUser(registeredUser));
    }

    //POST /auth/login
    // Authenticates a user and returns a JWT token along with user details
    // Example request body:
    // POST /auth/login
    // {
    //   "username": "john",
    //   "password": "secret123"
    // }
    // Example response body:
    // {
    //  "token": "eyJhbGciOiJIUzI1NiIs...",
    //  "expiresIn": 3600000,
    //  "user": {
    //     "id": 1,
    //     "username": "john",
    //     "email": "john@example.com",
    //     "fullName": "John Doe"
    //   }
    // }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginRequest loginUserDto) {
        User authenticatedUser = authService.authenticate(loginUserDto);

        String jwtToken = jwtService.generateToken(authenticatedUser);

        LoginResponse loginResponse = new LoginResponse(
                jwtToken,
                jwtService.getExpirationTime(),
                UserResponse.fromUser(authenticatedUser)
        );

        return ResponseEntity.ok(loginResponse);
    }
}
