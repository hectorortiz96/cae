package com.cae.reports.service;

import com.cae.reports.dto.request.AdminUpdateUserRequest;
import com.cae.reports.dto.request.UpdateUserRequest;
import com.cae.reports.model.User;
import com.cae.reports.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> allUsers() {
        List<User> users = new ArrayList<>();

        userRepository.findAll().forEach(users::add);

        return users;
    }

    public User updateCurrentUser(User user, UpdateUserRequest request) {
        validateUsername(request.username(), user.getId());

        user.setUsername(request.username());
        user.setFullName(request.fullName());
        return userRepository.save(user);
    }

    public User updateUser(Integer id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + id));
        validateUsername(request.username(), id);
        if (userRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        user.setUsername(request.username());
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        return userRepository.save(user);
    }

    private void validateUsername(String username, Integer id) {
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already in use");
        }
    }
}
