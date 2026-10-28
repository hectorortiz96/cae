package com.cae.reports.repository;

import com.cae.reports.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsernameAndIdNot(String username, Integer id);
    boolean existsByEmailAndIdNot(String email, Integer id);
}
