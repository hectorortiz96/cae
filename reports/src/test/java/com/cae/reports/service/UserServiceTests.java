package com.cae.reports.service;

import com.cae.reports.dto.request.AdminUpdateUserRequest;
import com.cae.reports.dto.request.UpdateUserRequest;
import com.cae.reports.model.Role;
import com.cae.reports.model.User;
import com.cae.reports.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTests {
    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserService userService = new UserService(userRepository);

    @Test
    void updatesOnlyTheCurrentUsersUsernameAndFullName() {
        User user = new User();
        user.setId(1);
        user.setUsername("old-name");
        user.setFullName("Old Name");
        UpdateUserRequest request = new UpdateUserRequest("new-name", "New Name");
        when(userRepository.existsByUsernameAndIdNot("new-name", 1)).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        User updatedUser = userService.updateCurrentUser(user, request);

        assertSame(user, updatedUser);
        assertEquals("new-name", updatedUser.getUsername());
        assertEquals("New Name", updatedUser.getFullName());
        verify(userRepository).save(user);
    }

    @Test
    void rejectsUsernameAlreadyUsedByAnotherUser() {
        User user = new User();
        user.setId(1);
        UpdateUserRequest request = new UpdateUserRequest("taken-name", "New Name");
        when(userRepository.existsByUsernameAndIdNot("taken-name", 1)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.updateCurrentUser(user, request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void adminUpdatesUserInfoWithoutChangingRoleOrPassword() {
        User user = new User();
        user.setId(1);
        user.setUsername("old-name");
        user.setFullName("Old Name");
        user.setEmail("old@example.com");
        user.setPassword("hashed-password");
        user.setRole(Role.ADMIN);
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        User updatedUser = userService.updateUser(
                1, new AdminUpdateUserRequest("new-name", "New Name", "new@example.com"));

        assertSame(user, updatedUser);
        assertEquals("new-name", user.getUsername());
        assertEquals("New Name", user.getFullName());
        assertEquals("new@example.com", user.getEmail());
        assertEquals("hashed-password", user.getPassword());
        assertEquals(Role.ADMIN, user.getRole());
        verify(userRepository).existsByUsernameAndIdNot("new-name", 1);
        verify(userRepository).existsByEmailAndIdNot("new@example.com", 1);
        verify(userRepository).save(user);
    }

    @Test
    void adminCanKeepExistingUsernameAndEmail() {
        User user = new User();
        user.setId(1);
        user.setUsername("same-name");
        user.setEmail("same@example.com");
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        userService.updateUser(
                1, new AdminUpdateUserRequest("same-name", "New Name", "same@example.com"));

        verify(userRepository).existsByUsernameAndIdNot("same-name", 1);
        verify(userRepository).existsByEmailAndIdNot("same@example.com", 1);
        verify(userRepository).save(user);
    }

    @Test
    void adminUpdateRejectsMissingUser() {
        when(userRepository.findById(99)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(
                        99, new AdminUpdateUserRequest("new-name", "New Name", "new@example.com")));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void adminUpdateRejectsDuplicateUsernameBeforeChangingUser() {
        User user = new User();
        user.setUsername("old-name");
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsernameAndIdNot("taken-name", 1)).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(
                        1, new AdminUpdateUserRequest("taken-name", "New Name", "new@example.com")));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("old-name", user.getUsername());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void adminUpdateRejectsDuplicateEmailBeforeChangingUser() {
        User user = new User();
        user.setUsername("old-name");
        user.setEmail("old@example.com");
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailAndIdNot("taken@example.com", 1)).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userService.updateUser(
                        1, new AdminUpdateUserRequest("new-name", "New Name", "taken@example.com")));

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("old-name", user.getUsername());
        assertEquals("old@example.com", user.getEmail());
        verify(userRepository, never()).save(any(User.class));
    }
}
