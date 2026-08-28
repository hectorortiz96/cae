package com.cae.reports.controller;

import com.cae.reports.dto.request.UpdateRoleRequest;
import com.cae.reports.dto.response.UserResponse;
import com.cae.reports.model.User;
import com.cae.reports.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Admin-only controller for user management
// All endpoints require ADMIN role
@RequestMapping("/admin")
@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {

        this.userRepository = userRepository;
    }

    // GET /admin/users - Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::fromUser)
                .toList();
        return ResponseEntity.ok(users);
    }

    // GET /admin/users/{id} - Get user by ID
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    // PUT /admin/users/{id}/role - Update user role
    // Example request body: { "role": "ADMIN" }
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setRole(request.getRole());
        userRepository.save(user);
        
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }

    // DELETE /admin/users/{id} - Delete user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

