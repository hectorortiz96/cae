package com.cae.reports.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

//Request Flow Summary:
// Client Request
//      ↓
// ┌─────────────────────────────────────┐
// │ 1. CORS Check                       │ → Is origin allowed?
// │ 2. JwtAuthFilter                    │ → Is token valid?
// │ 3. Authorization Check              │ → Is endpoint public or user authenticated?
// └─────────────────────────────────────┘
//      ↓
// Controller (if all checks pass)

@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize annotations
public class SecurityConfig {
    // Validates credentials
    private final AuthenticationProvider authenticationProvider;
    // Validates JWT tokens
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(
            AuthenticationProvider authenticationProvider,
            JwtAuthFilter jwtAuthFilter
    ) {
        this.authenticationProvider = authenticationProvider;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // Configures security for the application
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS with the configured source
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disables CSRF protection (not needed for stateless JWT APIs)
                .csrf(AbstractHttpConfigurer::disable)
                // Defines which endpoints require authentication
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints for login and registration
                        .requestMatchers("/auth/**").permitAll()
                        // Everything else requires auth
                        .anyRequest().authenticated()
                )
                // Configures session handling
                .sessionManagement(session -> session
                        //STATELESS = No server-side sessions
                        //Each request must include JWT token for authentication
                        //Ideal for REST APIs
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // Custom exception handling for unauthenticated/unauthorized requests
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                // Configures the authentication provider
                .authenticationProvider(authenticationProvider)
                // Adds JWT filter before username/password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Handles unauthenticated requests (no token or invalid token)
    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
            problemDetail.setTitle("Unauthorized");
            problemDetail.setDetail("Authentication is required to access this resource");
            problemDetail.setProperty("description", "Missing or invalid authentication token");

            new ObjectMapper().writeValue(response.getOutputStream(), problemDetail);
        };
    }

    // Handles unauthorized requests (valid token but insufficient permissions)
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
            problemDetail.setTitle("Forbidden");
            problemDetail.setDetail("You do not have permission to access this resource");
            problemDetail.setProperty("description", "Access denied");

            new ObjectMapper().writeValue(response.getOutputStream(), problemDetail);
        };
    }

    //Controls which external origins can call API:
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        //Allow frontend origins (supports both development and production)
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",  // Vite default dev server
                "http://localhost:8005"   // Alternative frontend port
        ));
        //Only these HTTP methods allowed
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        //Only these headers allowed
        configuration.setAllowedHeaders(List.of("Authorization","Content-Type"));
        //Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        //Applies to all endpoints
        source.registerCorsConfiguration("/**",configuration);

        return source;
    }
}
