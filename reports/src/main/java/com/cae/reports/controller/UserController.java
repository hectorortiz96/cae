package com.cae.reports.controller;

import com.cae.reports.dto.request.UpdateUserRequest;
import com.cae.reports.dto.response.LoginResponse;
import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.User;
import com.cae.reports.service.JwtService;
import com.cae.reports.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;
    private final JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    // GET /users/me - Get current authenticated user
    @GetMapping("/me")
    public ResponseEntity<UserResponse> authenticatedUser() {
        //Get current authenticated user from the security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(UserResponse.fromUser(currentUser));
    }

    // PUT /users/me - Update the authenticated user's editable profile fields
    @PutMapping("/me")
    public ResponseEntity<LoginResponse> updateAuthenticatedUser(
            @Valid @RequestBody UpdateUserRequest request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        User updatedUser = userService.updateCurrentUser(currentUser, request);
        String token = jwtService.generateToken(updatedUser);

        return ResponseEntity.ok(new LoginResponse(
                token,
                jwtService.getExpirationTime(),
                UserResponse.fromUser(updatedUser)
        ));
    }
}
