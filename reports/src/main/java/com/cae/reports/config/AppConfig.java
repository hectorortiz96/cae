package com.cae.reports.config;

import com.cae.reports.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AppConfig {
    private final UserRepository userRepository;

    public AppConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    //Loads user data during authentication.
    //Looks up user by username in database; throws exception if not found
    @Bean
    UserDetailsService userDetailsService() {
        return username -> userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    //Hashes and verifies passwords securely
    //Uses BCrypt algorithm (industry standard, includes salt automatically)
    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    //Purpose: Central component that coordinates authentication
    //How: Gets Spring Security's pre-configured manager;
    //you'll use this in your login controller to authenticate credentials
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    //Purpose: Performs the actual authentication logic How:
    @Bean
    AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, BCryptPasswordEncoder passwordEncoder) {
        //Uses UserDetailsService to load user from database
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        //Uses BCryptPasswordEncoder to compare submitted password with stored hash
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }
}
