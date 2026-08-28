package com.cae.reports.controller;

import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.User;
import com.cae.reports.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /users/me - Get current authenticated user
    @GetMapping("/me")
    public ResponseEntity<UserResponse> authenticatedUser() {
        //Get current authenticated user from the security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(UserResponse.fromUser(currentUser));
    }
}
